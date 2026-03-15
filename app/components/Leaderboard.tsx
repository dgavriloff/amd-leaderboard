"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RawProblemData,
  ProblemConfig,
  calculateAggregateScores,
} from "@/lib/scoring";

function formatTime(seconds: number): string {
  if (seconds < 1e-3) {
    return `${(seconds * 1e6).toFixed(2)} us`;
  }
  if (seconds < 1) {
    return `${(seconds * 1e3).toFixed(2)} ms`;
  }
  return `${seconds.toFixed(4)} s`;
}

function pick<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

const PAGE_SIZE = 10;

const themes = {
  light: {
    glass: "rgba(255,255,255,0.65)",
    glassHover: "rgba(255,255,255,0.75)",
    glassActive: "rgba(255,255,255,0.8)",
    border: "rgba(0,0,0,0.15)",
    separator: "rgba(0,0,0,0.08)",
    text: "#000000",
    textMuted: "#444444",
    textFaint: "#777777",
    btnActive: "rgba(255,255,255,0.7)",
    btnActiveText: "#000000",
    footerText: "rgba(255,255,255,0.85)",
    footerTextHover: "#ffffff",
    fallbackBg: "#e8e8e8",
  },
  dark: {
    glass: "rgba(0,0,0,0.5)",
    glassHover: "rgba(0,0,0,0.6)",
    glassActive: "rgba(0,0,0,0.65)",
    border: "rgba(255,255,255,0.15)",
    separator: "rgba(255,255,255,0.08)",
    text: "#f0f0f0",
    textMuted: "#cccccc",
    textFaint: "#888888",
    btnActive: "rgba(255,255,255,0.18)",
    btnActiveText: "#f0f0f0",
    footerText: "rgba(255,255,255,0.8)",
    footerTextHover: "#ffffff",
    fallbackBg: "#0f1114",
  },
};

const T = "background-color 600ms, color 600ms, border-color 600ms";
const ROW_T = "background-color 150ms, color 150ms, transform 100ms ease-out";

function GlassCard({
  children,
  c,
  style,
}: {
  children: React.ReactNode;
  c: (typeof themes)["light"];
  ready?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        borderTop: `1px solid ${c.border}`,
        borderBottom: `1px solid ${c.border}`,
        borderLeft: `1px solid ${c.border}`,
        borderRight: `1px solid ${c.border}`,
        borderRadius: 12,
        overflow: "hidden",
        transform: "translateZ(0)",
        willChange: "transform",
        contain: "layout style paint",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          height: "200%",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 50%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -2,
          height: 4,
          backdropFilter: "blur(4px) brightness(1.1)",
          WebkitBackdropFilter: "blur(4px) brightness(1.1)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.glass,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

export default function Leaderboard({
  rawProblems,
  problemConfigs,
  lightImages,
  darkImages,
}: {
  rawProblems: RawProblemData[];
  problemConfigs: ProblemConfig[];
  lightImages: string[];
  darkImages: string[];
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hideUnder5us, setHideUnder5us] = useState(true);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDark(true);
    setMounted(true);
  }, []);

  const [page, setPage] = useState(0);
  const [pageFade, setPageFade] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [closeHovered, setCloseHovered] = useState(false);
  const [pressed, setPressed] = useState<string | null>(null);
  const [themeSwitching, setThemeSwitching] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqCloseHovered, setFaqCloseHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Pick random images once on mount
  const [lightBg, setLightBg] = useState(() => pick(lightImages));
  const [darkBg, setDarkBg] = useState(() => pick(darkImages));
  const [lightLoaded, setLightLoaded] = useState(false);
  const [darkLoaded, setDarkLoaded] = useState(false);

  useEffect(() => {
    if (lightBg) {
      const img = new Image();
      img.src = lightBg;
      if (img.complete) { setLightLoaded(true); } else {
        img.onload = () => setLightLoaded(true);
        img.onerror = () => setLightLoaded(true);
      }
    } else { setLightLoaded(true); }
    if (darkBg) {
      const img = new Image();
      img.src = darkBg;
      if (img.complete) { setDarkLoaded(true); } else {
        img.onload = () => setDarkLoaded(true);
        img.onerror = () => setDarkLoaded(true);
      }
    } else { setDarkLoaded(true); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const c = dark ? themes.dark : themes.light;

  const allEntries = useMemo(
    () => calculateAggregateScores(rawProblems, hideUnder5us, 20),
    [rawProblems, hideUnder5us]
  );

  const totalPages = Math.max(1, Math.ceil(allEntries.length / PAGE_SIZE));
  const entries = allEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const maxAggregate = problemConfigs.reduce((sum, p) => sum + p.maxPoints, 0);
  const effectiveIndex = selectedIndex !== null && selectedIndex < entries.length ? selectedIndex : null;
  const selectedEntry = effectiveIndex !== null ? entries[effectiveIndex] : null;
  const [lastSelectedEntry, setLastSelectedEntry] = useState(selectedEntry);

  useEffect(() => {
    if (selectedEntry) setLastSelectedEntry(selectedEntry);
  }, [selectedEntry]);

  // Use lastSelectedEntry for rendering the detail card so it persists during close animation
  const displayEntry = selectedEntry ?? lastSelectedEntry;

  const ready = true;
  const [overlayFading, setOverlayFading] = useState(false);
  const [overlayDone, setOverlayDone] = useState(false);

  useEffect(() => {
    if (!mounted || !lightLoaded || !darkLoaded) return;
    // Wait for glass to composite, then start fade
    const t1 = setTimeout(() => setOverlayFading(true), 600);
    // Remove from DOM after fade completes
    const t2 = setTimeout(() => setOverlayDone(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mounted, lightLoaded, darkLoaded]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 12px 56px 12px",
        overflow: "auto",
        background: c.fallbackBg,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      }}
    >
      {/* Background images */}
      {lightBg && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${lightBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: lightLoaded && !dark ? 1 : 0,
            transition: "opacity 800ms",
            zIndex: 0,
          }}
        />
      )}
      {darkBg && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${darkBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: darkLoaded && dark ? 1 : 0,
            transition: "opacity 800ms",
            zIndex: 0,
          }}
        />
      )}
      {/* Fallback if no images */}
      {!lightBg && !darkBg && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: c.fallbackBg,
            transition: "background-color 300ms",
            zIndex: 0,
          }}
        />
      )}
      {/* If only one theme has images, show fallback for the other */}
      {lightBg && !darkBg && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: themes.dark.fallbackBg,
            opacity: dark ? 1 : 0,
            transition: "opacity 600ms",
            zIndex: 0,
          }}
        />
      )}
      {!lightBg && darkBg && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: themes.light.fallbackBg,
            opacity: dark ? 0 : 1,
            transition: "opacity 600ms",
            zIndex: 0,
          }}
        />
      )}

      {/* Main content */}
      <div style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}>
        {/* Leaderboard */}
        <div style={{ width: isMobile ? "calc(100vw - 24px)" : 448, flexShrink: 0, userSelect: "none", overflow: "hidden" }}>
          <GlassCard c={c} ready={ready}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${c.separator}`,
                fontSize: 10,
                color: c.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "8px 16px",
                transition: T,
              }}
            >
              <span style={{ width: 40, textAlign: "center", flexShrink: 0 }}>#</span>
              <span style={{ flex: 1 }}>Competitor</span>
              <span style={{ width: 96, textAlign: "right" }}>Score</span>
            </div>

            {/* Rows */}
            <div style={{ minHeight: PAGE_SIZE * 41 }}>
            {entries.map((entry, idx) => {
              const isSelected = effectiveIndex === idx;
              const isHovered = hovered === entry.user_name;
              const isLast = idx === entries.length - 1;
              const showDrawer = isMobile && isSelected && selectedEntry;

              return (
                <div key={entry.user_name} ref={(el) => { if (el) rowRefs.current.set(idx, el); }}>
                  <div
                    onClick={() => {
                      if (isMobile && !isSelected) {
                        const rowEl = rowRefs.current.get(idx);
                        if (rowEl && containerRef.current) {
                          const rowTop = rowEl.getBoundingClientRect().top;
                          requestAnimationFrame(() => {
                            const newRowTop = rowEl.getBoundingClientRect().top;
                            containerRef.current!.scrollBy(0, newRowTop - rowTop);
                          });
                        }
                      }
                      setSelectedIndex(isSelected ? null : idx);
                      if (isSelected) setHovered(null);
                    }}
                    onMouseEnter={() => setHovered(entry.user_name)}
                    onMouseLeave={() => { setHovered(null); setPressed(null); }}
                    onMouseDown={() => setPressed(entry.user_name)}
                    onMouseUp={() => setPressed(null)}
                    onTouchStart={() => setPressed(entry.user_name)}
                    onTouchEnd={() => setPressed(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 16px",
                      cursor: "pointer",
                      background: isSelected ? c.glassActive : isHovered ? c.glassHover : "transparent",
                      borderBottom: (!isLast && !showDrawer) ? `1px solid ${c.separator}` : "none",
                      transform: pressed === entry.user_name ? "scale(0.985)" : "scale(1)",
                      transition: ROW_T,
                    }}
                  >
                    <span style={{ width: 40, textAlign: "center", flexShrink: 0, fontSize: 14, color: c.textMuted, opacity: pageFade ? 1 : 0, transition: `${T}, opacity 300ms ease-in-out` }}>
                      {String(entry.rank).padStart(2, "0")}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: c.text, opacity: pageFade ? 1 : 0, transition: `${T}, opacity 300ms ease-in-out`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.user_name}
                    </span>
                    <span style={{ width: 96, textAlign: "right", fontSize: 12, color: c.textMuted, fontVariantNumeric: "tabular-nums", opacity: pageFade ? 1 : 0, transition: `${T}, opacity 300ms ease-in-out` }}>
                      {entry.aggregate.toFixed(1)}
                      <span style={{ color: c.textFaint, transition: T }}>/{maxAggregate}</span>
                    </span>
                  </div>
                  {/* Mobile inline drawer */}
                  {isMobile && (
                    <div style={{
                      maxHeight: isSelected ? 300 : 0,
                      overflow: "hidden",
                      transition: "max-height 250ms ease-out",
                    }}>
                    <div style={{
                      padding: "12px 16px 12px 56px",
                      background: c.glassActive,
                      borderBottom: !isLast ? `1px solid ${c.separator}` : "none",
                      transition: T,
                    }}>
                      {problemConfigs.map((p) => {
                        const detail = entry.problems?.[p.name];
                        return (
                          <div key={p.name} style={{ marginBottom: 10 }}>
                            <a
                              href={`https://www.gpumode.com/leaderboard/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, transition: T, fontWeight: 700, textDecoration: "none", display: "block" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = c.textMuted)}
                            >
                              {p.name}
                            </a>
                            {detail ? (
                              <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontVariantNumeric: "tabular-nums" }}>
                                <span style={{ fontSize: 12, color: c.text, transition: T }}>#{detail.rank}</span>
                                <span style={{ color: c.textFaint, transition: T }}>|</span>
                                <span style={{ fontSize: 12, color: c.text, fontWeight: 700, transition: T }}>{formatTime(detail.time)}</span>
                                <span style={{ color: c.textFaint, transition: T }}>|</span>
                                <span style={{ fontSize: 11, color: c.textFaint, transition: T }}>{detail.points.toFixed(1)}</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: c.textFaint, transition: T }}>---</div>
                            )}
                          </div>
                        );
                      })}
                      <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2, transition: T }}>Total</div>
                      <div style={{ fontSize: 14, color: c.text, fontWeight: 700, fontVariantNumeric: "tabular-nums", transition: T }}>
                        {entry.aggregate.toFixed(1)}
                        <span style={{ color: c.textFaint, fontWeight: 400, transition: T }}>/{maxAggregate}</span>
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>

            {/* Toggle buttons */}
            <div style={{ display: "flex", alignItems: "stretch", borderTop: `1px solid ${c.separator}`, transition: T }}>
              <button
                onClick={() => setHideUnder5us(!hideUnder5us)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderTop: "none",
                  borderBottom: "none",
                  borderLeft: "none",
                  borderRight: `1px solid ${c.separator}`,
                  background: hideUnder5us ? c.btnActive : "transparent",
                  color: hideUnder5us ? c.btnActiveText : c.textMuted,
                  cursor: "pointer",
                  transition: T,
                  fontFamily: "inherit",
                }}
              >
                hide &lt;5us
              </button>
              <button
                onClick={() => {
                  if (themeSwitching) return;
                  setThemeSwitching(true);
                  const next = !dark;
                  if (dark) { setDarkBg(pick(darkImages)); }
                  else { setLightBg(pick(lightImages)); }
                  setDark(next);
                  localStorage.setItem("theme", next ? "dark" : "light");
                  setTimeout(() => setThemeSwitching(false), 800);
                }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: 10,
                  borderTop: "none",
                  borderBottom: "none",
                  borderLeft: "none",
                  borderRight: `1px solid ${c.separator}`,
                  background: "transparent",
                  color: c.textMuted,
                  cursor: "pointer",
                  transition: T,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                {dark ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  setPageFade(false);
                  setTimeout(() => {
                    setPage((page + 1) % totalPages);
                    // New content renders with pageFade still false (opacity 0)
                    // Then fade it in on next frame
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        setPageFade(true);
                      });
                    });
                  }, 300);
                }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: 10,
                  letterSpacing: "0.05em",
                  borderTop: "none",
                  borderBottom: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  background: "transparent",
                  color: c.textMuted,
                  cursor: "pointer",
                  transition: T,
                  fontFamily: "inherit",
                }}
              >
                {page + 1}/{totalPages}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Detail card — desktop only */}
        {!isMobile && <div
          style={{
            flexShrink: 0,
            width: effectiveIndex !== null ? 224 : 0,
            overflow: "hidden",
            opacity: effectiveIndex !== null ? 1 : 0,
            transition: "width 300ms ease, opacity 250ms ease",
          }}
        >
          {displayEntry && (
            <GlassCard c={c} ready={ready} style={{ width: 224 }}>
              <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${c.separator}`, transition: T }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: c.text, fontWeight: 700, padding: "8px 16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", transition: T }}>
                  {displayEntry.user_name}
                </span>
                <button
                  onClick={() => { setSelectedIndex(null); setCloseHovered(false); setHovered(null); }}
                  onMouseEnter={() => setCloseHovered(true)}
                  onMouseLeave={() => setCloseHovered(false)}
                  style={{
                    width: 36,
                    borderTop: "none",
                    borderBottom: "none",
                    borderRight: "none",
                    borderLeft: `1px solid ${c.separator}`,
                    color: closeHovered ? c.text : c.textFaint,
                    background: closeHovered ? c.glassHover : "transparent",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: T,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "inherit",
                  }}
                >
                  x
                </button>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                {problemConfigs.map((p) => {
                  const detail = displayEntry.problems[p.name];
                  return (
                    <div key={p.name}>
                      <a
                        href={`https://www.gpumode.com/leaderboard/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, transition: T, fontWeight: 700, textDecoration: "none", display: "block" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = c.textMuted)}
                      >
                        {p.name} ↗
                      </a>
                      {detail ? (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontVariantNumeric: "tabular-nums" }}>
                          <span style={{ fontSize: 12, color: c.text, transition: T }}>
                            #{detail.rank}
                          </span>
                          <span style={{ color: c.textFaint, transition: T }}>|</span>
                          <span style={{ fontSize: 12, color: c.text, fontWeight: 700, transition: T }}>
                            {formatTime(detail.time)}
                          </span>
                          <span style={{ color: c.textFaint, transition: T }}>|</span>
                          <span style={{ fontSize: 11, color: c.textFaint, transition: T }}>
                            {detail.points.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: c.textFaint, transition: T }}>---</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: `1px solid ${c.separator}`, padding: "8px 16px", transition: T }}>
                <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, transition: T }}>
                  Total
                </div>
                <div style={{ fontSize: 14, color: c.text, fontWeight: 700, fontVariantNumeric: "tabular-nums", transition: T }}>
                  {displayEntry.aggregate.toFixed(1)}
                  <span style={{ color: c.textFaint, fontWeight: 400, transition: T }}>/{maxAggregate}</span>
                </div>
              </div>
            </GlassCard>
          )}
        </div>}
      </div>

      {/* Header */}
      <div style={{
        position: "fixed",
        top: -1,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 1,
      }}>
        <div style={{ width: isMobile ? "calc(100vw + 2px)" : 450 }}>
          <GlassCard c={c} ready={ready} style={{ borderTop: "none", borderLeft: isMobile ? "none" : undefined, borderRight: isMobile ? "none" : undefined, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div style={{ padding: "calc(14px + env(safe-area-inset-top, 0px)) 16px 10px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, transition: T }}>
                <span style={{ color: c.textMuted, transition: T }}>AMD</span> + <span style={{ color: c.textMuted, transition: T }}>GPU Mode</span> Phase 1 Leaderboard
              </div>
              <div style={{ fontSize: 10, color: c.textFaint, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em", transition: T }}>
                Aggregated score from 3 kernel leaderboards
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "fixed",
        bottom: -1,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 1,
      }}>
        <div style={{ width: isMobile ? "calc(100vw + 2px)" : 450 }}>
          <GlassCard c={c} ready={ready} style={{ borderBottom: "none", borderLeft: isMobile ? "none" : undefined, borderRight: isMobile ? "none" : undefined, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 24,
              padding: "8px 0",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              <a
                href="https://drive.google.com/file/d/15abWjTlpEbN-JwYA8WAY-mKlpg9yZYzY/view?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: c.textMuted, textDecoration: "none", transition: T }}
                onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = c.textMuted)}
              >
                Rules
              </a>
              <span
                onClick={() => setFaqOpen(true)}
                style={{ color: c.textMuted, cursor: "pointer", transition: T }}
                onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = c.textMuted)}
              >
                FAQ
              </span>
              <a
                href="https://github.com/dgavriloff/amd-leaderboard"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: c.textMuted, textDecoration: "none", transition: T }}
                onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = c.textMuted)}
              >
                GitHub
              </a>
            </div>
            <div style={{
              textAlign: "center",
              fontSize: 9,
              fontWeight: 700,
              color: c.textFaint,
              padding: "0 16px calc(8px + env(safe-area-inset-bottom, 0px)) 16px",
              transition: T,
            }}>
              This website and its creator have no official affiliation with GPU MODE or AMD.
            </div>
          </GlassCard>
        </div>
      </div>

      {/* FAQ Modal */}
      <div
        onClick={() => setFaqOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: faqOpen ? (dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)") : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: faqOpen ? 50 : -1,
          padding: 12,
          opacity: faqOpen ? 1 : 0,
          pointerEvents: faqOpen ? "auto" : "none",
          transition: "opacity 300ms ease, background-color 300ms ease",
        }}
      >
        <div onClick={(e) => e.stopPropagation()} style={{
          width: "100%",
          maxWidth: 420,
          background: dark ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.92)",
          borderTop: `1px solid ${c.border}`,
          borderBottom: `1px solid ${c.border}`,
          borderLeft: `1px solid ${c.border}`,
          borderRight: `1px solid ${c.border}`,
          borderRadius: 12,
          overflow: "hidden",
          transition: T,
        }}>
              <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${c.separator}`, transition: T }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: c.text, padding: "10px 16px", textTransform: "uppercase", letterSpacing: "0.05em", transition: T }}>
                  FAQ
                </span>
                <button
                  onClick={() => { setFaqOpen(false); setFaqCloseHovered(false); }}
                  onMouseEnter={() => setFaqCloseHovered(true)}
                  onMouseLeave={() => setFaqCloseHovered(false)}
                  style={{
                    width: 36,
                    borderTop: "none",
                    borderBottom: "none",
                    borderRight: "none",
                    borderLeft: `1px solid ${c.separator}`,
                    color: faqCloseHovered ? c.text : c.textFaint,
                    background: faqCloseHovered ? c.glassHover : "transparent",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: T,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "inherit",
                  }}
                >
                  x
                </button>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, transition: T }}>
                    What is this?
                  </div>
                  <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T }}>
                    GPU MODE is running a kernel optimization challenge on AMD MI355X with three separate problems: MXFP4 GEMM, MLA Decode, and MXFP4 MoE.
                    Each has its own leaderboard, but the top 10 winners are determined by a combined aggregate score across all three.
                    This site pulls from all three leaderboards and calculates that combined ranking so you can see where you actually stand.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, transition: T }}>
                    How is the score calculated?
                  </div>
                  <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T }}>
                    Each kernel problem has a maximum point value: MXFP4 GEMM (1,000), MLA Decode (1,250), MXFP4 MoE (1,500).
                    Your score per problem = MaxPoints &times; (1 - rank/20). Your total is the sum of all three.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, transition: T }}>
                    What does rank 1 = rank 0 mean?
                  </div>
                  <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T }}>
                    The leaderboard displays ranks starting at 1, but the scoring formula uses 0-indexed ranks.
                    So displayed rank 1 uses rank 0 in the formula, giving full points. Rank 20 (displayed) uses rank 19, giving 5% of max points.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, transition: T }}>
                    Why are some submissions hidden?
                  </div>
                  <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T }}>
                    Submissions with runtime under 5 microseconds are filtered out by default as likely harness hacks.
                    You can toggle this with the &quot;hide &lt;5us&quot; button.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, transition: T }}>
                    How often does the data refresh?
                  </div>
                  <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T }}>
                    The page revalidates every 60 seconds, pulling fresh data from the GPU Mode API.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, transition: T }}>
                    What GPU is this for?
                  </div>
                  <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T }}>
                    All benchmarks run on the AMD Instinct MI355X. Only MI355X rankings are shown.
                  </div>
                </div>
              </div>
          </div>
      </div>

      {/* Loading overlay — covers everything, fades out once ready */}
      {!overlayDone && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: dark ? themes.dark.fallbackBg : themes.light.fallbackBg,
            zIndex: 100,
            pointerEvents: overlayFading ? "none" : "auto",
            opacity: overlayFading ? 0 : 1,
            transition: "opacity 800ms ease",
          }}
        />
      )}
    </div>
  );
}
