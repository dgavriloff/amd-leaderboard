"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const PAGE_SIZE_DESKTOP = 10;
const PAGE_SIZE_MOBILE = 5;

const themes = {
  light: {
    glass: "rgba(255,255,255,0.45)",
    glassHover: "rgba(255,255,255,0.55)",
    glassActive: "rgba(255,255,255,0.6)",
    border: "rgba(0,0,0,0.15)",
    separator: "rgba(0,0,0,0.08)",
    text: "#000000",
    textMuted: "#444444",
    textFaint: "#777777",
    btnActive: "rgba(0,0,0,0.12)",
    btnActiveText: "#000000",
    footerText: "rgba(0,0,0,0.5)",
    footerTextHover: "rgba(0,0,0,0.8)",
    fallbackBg: "#e8e8e8",
  },
  dark: {
    glass: "rgba(0,0,0,0.4)",
    glassHover: "rgba(0,0,0,0.5)",
    glassActive: "rgba(0,0,0,0.55)",
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

type Theme = (typeof themes)["light"];

const T = "background-color 600ms, color 600ms, border-color 600ms";
const ROW_T = "background-color 150ms, color 150ms, transform 100ms ease-out";
const BTN_T = "background-color 150ms, color 150ms, border-color 600ms";

// --- Static styles extracted to constants ---
const glassBlurStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  height: "200%",
  backdropFilter: "blur(12px) saturate(1.4)",
  WebkitBackdropFilter: "blur(12px) saturate(1.4)",
  maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 50%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 50%)",
  pointerEvents: "none",
  zIndex: 0,
  transform: "translateZ(0)",
};

const glassEdgeStyle: React.CSSProperties = {
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
};

const glassContentStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
};

const bgImageBase: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "cover",
  backgroundPosition: "center",
  zIndex: 0,
};

// --- Memoized GlassCard ---
const GlassCard = memo(function GlassCard({
  children,
  c,
  style,
}: {
  children: React.ReactNode;
  c: Theme;
  ready?: boolean;
  style?: React.CSSProperties;
}) {
  const outerStyle = useMemo<React.CSSProperties>(() => ({
    position: "relative",
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    overflow: "hidden",
    transform: "translateZ(0)",
    willChange: "transform",
    contain: "layout style paint",
    ...style,
  }), [c.border, style]);

  const tintStyle = useMemo<React.CSSProperties>(() => ({
    position: "absolute",
    inset: 0,
    background: c.glass,
    pointerEvents: "none",
    zIndex: 0,
  }), [c.glass]);

  return (
    <div style={outerStyle}>
      <div style={glassBlurStyle} />
      <div style={glassEdgeStyle} />
      <div style={tintStyle} />
      <div style={glassContentStyle}>{children}</div>
    </div>
  );
});

// --- Memoized row component with local hover/press state ---
const LeaderboardRow = memo(function LeaderboardRow({
  entry,
  idx,
  isSelected,
  isLast,
  isMobile,
  pageFade,
  maxAggregate,
  c,
  problemConfigs,
  onSelect,
  onHover,
  rowRef,
}: {
  entry: { user_name: string; rank: number; aggregate: number; problems: Record<string, { rank: number; time: number; points: number } | null> };
  idx: number;
  isSelected: boolean;
  isLast: boolean;
  isMobile: boolean;
  pageFade: boolean;
  maxAggregate: number;
  c: Theme;
  problemConfigs: ProblemConfig[];
  onSelect: (idx: number, isSelected: boolean) => void;
  onHover: (name: string | null) => void;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  const [localHovered, setLocalHovered] = useState(false);
  const [localPressed, setLocalPressed] = useState(false);
  const showDrawer = isMobile && isSelected;

  const handleClick = useCallback(() => {
    onSelect(idx, isSelected);
  }, [idx, isSelected, onSelect]);

  const rowStyle = useMemo<React.CSSProperties>(() => ({
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    cursor: "pointer",
    background: isSelected ? c.glassActive : localHovered ? c.glassHover : "transparent",
    borderBottom: (!isLast && !showDrawer) ? `1px solid ${c.separator}` : "none",
    transform: localPressed ? "scale(0.985)" : "scale(1)",
    transition: ROW_T,
    contain: "layout style paint",
  }), [isSelected, localHovered, localPressed, isLast, showDrawer, c]);

  return (
    <div ref={rowRef}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isMobile ? isSelected : undefined}
        aria-label={`${entry.user_name}, rank ${entry.rank}, score ${entry.aggregate.toFixed(1)} out of ${maxAggregate}`}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
        onMouseEnter={() => { if (!isMobile) { setLocalHovered(true); onHover(entry.user_name); } }}
        onMouseLeave={() => { if (!isMobile) { setLocalHovered(false); setLocalPressed(false); onHover(null); } }}
        onMouseDown={() => setLocalPressed(true)}
        onMouseUp={() => setLocalPressed(false)}
        onTouchStart={() => setLocalPressed(true)}
        onTouchEnd={() => setLocalPressed(false)}
        style={rowStyle}
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
        <div
          role="region"
          aria-label={`Details for ${entry.user_name}`}
          aria-hidden={!isSelected}
          style={{
            maxHeight: isSelected ? 300 : 0,
            overflow: "hidden",
            transition: "max-height 250ms ease-out",
          }}
        >
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
                  className="hover-link"
                  style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, transition: T, fontWeight: 700, textDecoration: "none", display: "block" }}
                >
                  {p.name}
                </a>
                {detail ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ fontSize: 12, color: c.text, transition: T }}>#{detail.rank}</span>
                    <span aria-hidden="true" style={{ color: c.textFaint, transition: T }}>|</span>
                    <span style={{ fontSize: 12, color: c.text, fontWeight: 700, transition: T }}>{formatTime(detail.time)}</span>
                    <span aria-hidden="true" style={{ color: c.textFaint, transition: T }}>|</span>
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
});

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
  const [themeSwitching, setThemeSwitching] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqCloseHovered, setFaqCloseHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const faqCloseRef = useRef<HTMLButtonElement>(null);
  const faqTriggerRef = useRef<HTMLSpanElement>(null);

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

  // Set body background for safe area
  useEffect(() => {
    document.body.style.background = dark ? "#000000" : "#ffffff";
  }, [dark]);

  const allEntries = useMemo(
    () => calculateAggregateScores(rawProblems, hideUnder5us, 20),
    [rawProblems, hideUnder5us]
  );

  const pageSize = isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
  const totalPages = Math.max(1, Math.ceil(allEntries.length / pageSize));
  const entries = allEntries.slice(page * pageSize, (page + 1) * pageSize);

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
    const t1 = setTimeout(() => setOverlayFading(true), 600);
    const t2 = setTimeout(() => setOverlayDone(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mounted, lightLoaded, darkLoaded]);

  // Focus management for FAQ modal
  useEffect(() => {
    if (faqOpen && faqCloseRef.current) {
      faqCloseRef.current.focus();
    }
  }, [faqOpen]);

  // Trap focus inside FAQ modal and handle Escape
  useEffect(() => {
    if (!faqOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFaqOpen(false);
        faqTriggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [faqOpen]);

  // Stable callbacks for row interaction
  const handleRowSelect = useCallback((idx: number, wasSelected: boolean) => {
    if (isMobile && !wasSelected) {
      const rowEl = rowRefs.current.get(idx);
      if (rowEl && containerRef.current) {
        const rowTop = rowEl.getBoundingClientRect().top;
        requestAnimationFrame(() => {
          const newRowTop = rowEl.getBoundingClientRect().top;
          containerRef.current!.scrollBy(0, newRowTop - rowTop);
        });
      }
    }
    setSelectedIndex(wasSelected ? null : idx);
    if (wasSelected) setHovered(null);
  }, [isMobile]);

  const handleRowHover = useCallback((name: string | null) => {
    setHovered(name);
  }, []);

  const handlePageNext = useCallback(() => {
    setPageFade(false);
    setTimeout(() => {
      setPage((prev) => (prev + 1) % totalPages);
      requestAnimationFrame(() => {
        setPageFade(true);
      });
    }, 300);
  }, [totalPages]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      role="main"
      aria-label="AMD + GPU Mode Phase 1 Leaderboard"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "68px 12px 68px 12px",
        overflow: "auto",
        background: c.fallbackBg,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Skip navigation link */}
      <a
        href="#leaderboard-table"
        style={{
          position: "absolute",
          left: -9999,
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
          zIndex: 200,
        }}
        onFocus={(e) => { e.currentTarget.style.left = "12px"; e.currentTarget.style.top = "12px"; e.currentTarget.style.width = "auto"; e.currentTarget.style.height = "auto"; e.currentTarget.style.padding = "8px 16px"; e.currentTarget.style.background = c.glass; e.currentTarget.style.color = c.text; e.currentTarget.style.borderRadius = "8px"; }}
        onBlur={(e) => { e.currentTarget.style.left = "-9999px"; e.currentTarget.style.width = "1px"; e.currentTarget.style.height = "1px"; }}
      >
        Skip to leaderboard
      </a>

      {/* Background images — decorative, hidden from screen readers */}
      {lightBg && (
        <div
          aria-hidden="true"
          style={{
            ...bgImageBase,
            backgroundImage: `url(${lightBg})`,
            opacity: lightLoaded && !dark ? 1 : 0,
            transition: "opacity 800ms",
          }}
        />
      )}
      {darkBg && (
        <div
          aria-hidden="true"
          style={{
            ...bgImageBase,
            backgroundImage: `url(${darkBg})`,
            opacity: darkLoaded && dark ? 1 : 0,
            transition: "opacity 800ms",
          }}
        />
      )}
      {!lightBg && !darkBg && (
        <div
          aria-hidden="true"
          style={{
            ...bgImageBase,
            background: c.fallbackBg,
            transition: "background-color 300ms",
          }}
        />
      )}
      {lightBg && !darkBg && (
        <div
          aria-hidden="true"
          style={{
            ...bgImageBase,
            background: themes.dark.fallbackBg,
            opacity: dark ? 1 : 0,
            transition: "opacity 600ms",
          }}
        />
      )}
      {!lightBg && darkBg && (
        <div
          aria-hidden="true"
          style={{
            ...bgImageBase,
            background: themes.light.fallbackBg,
            opacity: dark ? 0 : 1,
            transition: "opacity 600ms",
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
        <div id="leaderboard-table" style={{ width: isMobile ? "calc(100vw - 24px)" : 448, flexShrink: 0, overflow: "hidden" }}>
          <GlassCard c={c} ready={ready}>
            {/* Column header */}
            <div
              role="row"
              aria-label="Column headers"
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${c.separator}`,
                fontSize: 10,
                color: c.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "10px 16px 9px 16px",
                transition: T,
              }}
            >
              <span role="columnheader" style={{ width: 40, textAlign: "center", flexShrink: 0 }}>#</span>
              <span role="columnheader" style={{ flex: 1 }}>Competitor</span>
              <span role="columnheader" style={{ width: 96, textAlign: "right" }}>Score</span>
            </div>

            {/* Rows */}
            <div role="list" aria-label="Leaderboard entries" style={{ minHeight: pageSize * 41 }}>
            {entries.map((entry, idx) => (
              <LeaderboardRow
                key={entry.user_name}
                entry={entry}
                idx={idx}
                isSelected={effectiveIndex === idx}
                isLast={idx === entries.length - 1}
                isMobile={isMobile}
                pageFade={pageFade}
                maxAggregate={maxAggregate}
                c={c}
                problemConfigs={problemConfigs}
                onSelect={handleRowSelect}
                onHover={handleRowHover}
                rowRef={(el) => { if (el) rowRefs.current.set(idx, el); }}
              />
            ))}
            </div>

            {/* Toggle buttons */}
            <div role="toolbar" aria-label="Leaderboard controls" style={{ display: "flex", alignItems: "stretch", borderTop: `1px solid ${c.separator}`, transition: T }}>
              <button
                onClick={() => setHideUnder5us(!hideUnder5us)}
                aria-pressed={hideUnder5us}
                aria-label={hideUnder5us ? "Showing entries with time >= 5 microseconds. Click to show all." : "Showing all entries. Click to hide entries under 5 microseconds."}
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
                aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
                onClick={() => {
                  if (themeSwitching) return;
                  setThemeSwitching(true);
                  const next = !dark;
                  if (dark) { setDarkBg(pick(darkImages)); }
                  else { setLightBg(pick(lightImages)); }
                  setDark(next);
                  localStorage.setItem("theme", next ? "dark" : "light");
                  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
                  if (isMobile && isSafari) {
                    window.location.reload();
                    return;
                  }
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
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handlePageNext}
                aria-label={`Page ${page + 1} of ${totalPages}. Click to go to next page.`}
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
          aria-live="polite"
          style={{
            flexShrink: 0,
            width: effectiveIndex !== null ? 224 : 0,
            overflow: "hidden",
            opacity: effectiveIndex !== null ? 1 : 0,
            transition: "width 300ms ease, opacity 250ms ease, margin-left 300ms ease",
            marginLeft: effectiveIndex !== null ? 0 : -12,
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
                  aria-label="Close detail panel"
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
                    transition: BTN_T,
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
                        className="hover-link"
                        style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, transition: T, fontWeight: 700, textDecoration: "none", display: "block" }}
                      >
                        {p.name} <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="10" height="10" style={{ display: "inline", verticalAlign: "middle" }}><path d="M3.5 8.5l5-5M4.5 3.5h4v4" /></svg>
                      </a>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ fontSize: 12, color: detail ? c.text : "transparent", transition: T }}>
                          #{detail ? detail.rank : "00"}
                        </span>
                        <span aria-hidden="true" style={{ color: detail ? c.textFaint : "transparent", transition: T }}>|</span>
                        <span style={{ fontSize: 12, color: detail ? c.text : "transparent", fontWeight: 700, transition: T }}>
                          {detail ? formatTime(detail.time) : "000.00 us"}
                        </span>
                        <span aria-hidden="true" style={{ color: detail ? c.textFaint : "transparent", transition: T }}>|</span>
                        <span style={{ fontSize: 11, color: detail ? c.textFaint : "transparent", transition: T }}>
                          {detail ? detail.points.toFixed(1) : "0000.0"}
                        </span>
                      </div>
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
      <header style={{
        position: "fixed",
        top: -1,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 12px",
        zIndex: 1,
      }}>
        <div style={{ width: isMobile ? "100%" : 448 }}>
          <GlassCard c={c} ready={ready} style={{ borderTop: "none", borderLeft: isMobile ? "none" : undefined, borderRight: isMobile ? "none" : undefined, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <div style={{ paddingTop: "max(14px, env(safe-area-inset-top))", paddingLeft: 16, paddingRight: 16, paddingBottom: 10 }}>
              <h1 style={{ fontSize: 13, fontWeight: 700, color: c.text, transition: T, margin: 0 }}>
                <span style={{ color: c.textMuted, transition: T }}>AMD</span> + <span style={{ color: c.textMuted, transition: T }}>GPU Mode</span> Phase 1 Leaderboard
              </h1>
              <p style={{ fontSize: 10, color: c.textFaint, marginTop: 3, marginBottom: 0, textTransform: "uppercase", letterSpacing: "0.05em", transition: T }}>
                Aggregated score from 3 kernel leaderboards
              </p>
            </div>
          </GlassCard>
        </div>
      </header>

      {/* Footer */}
      <footer style={{
        position: "fixed",
        bottom: -1,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 12px",
        zIndex: 1,
      }}>
        <div style={{ width: isMobile ? "100%" : 448 }}>
          <GlassCard c={c} ready={ready} style={{ borderBottom: "none", borderLeft: isMobile ? "none" : undefined, borderRight: isMobile ? "none" : undefined, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
            <nav aria-label="Footer links" style={{
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
                className="hover-link"
                style={{ color: c.textMuted, textDecoration: "none", transition: T }}
              >
                Rules
              </a>
              <span
                ref={faqTriggerRef}
                role="button"
                tabIndex={0}
                onClick={() => setFaqOpen(true)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFaqOpen(true); } }}
                className="hover-link"
                style={{ color: c.textMuted, cursor: "pointer", transition: T }}
              >
                FAQ
              </span>
              <a
                href="https://github.com/dgavriloff/amd-leaderboard"
                target="_blank"
                rel="noopener noreferrer"
                className="hover-link"
                style={{ color: c.textMuted, textDecoration: "none", transition: T }}
              >
                GitHub
              </a>
            </nav>
            <p style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 700,
              color: c.textFaint,
              padding: "0 16px max(8px, env(safe-area-inset-bottom)) 16px",
              transition: T,
              margin: 0,
            }}>
              This website and its creator have no official affiliation with GPU MODE or AMD.
            </p>
          </GlassCard>
        </div>
      </footer>

      {/* FAQ Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Frequently Asked Questions"
        aria-hidden={!faqOpen}
        onClick={() => { setFaqOpen(false); faqTriggerRef.current?.focus(); }}
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
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          overflow: "hidden",
          transition: T,
        }}>
              <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${c.separator}`, transition: T }}>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: c.text, padding: "10px 16px", textTransform: "uppercase", letterSpacing: "0.05em", transition: T }}>
                  FAQ
                </span>
                <button
                  ref={faqCloseRef}
                  onClick={() => { setFaqOpen(false); setFaqCloseHovered(false); faqTriggerRef.current?.focus(); }}
                  onMouseEnter={() => setFaqCloseHovered(true)}
                  onMouseLeave={() => setFaqCloseHovered(false)}
                  aria-label="Close FAQ"
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
                    transition: BTN_T,
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
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, marginTop: 0, transition: T }}>
                    What is this?
                  </h2>
                  <p style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T, margin: 0 }}>
                    GPU MODE is running a kernel optimization challenge on AMD MI355X with three separate problems: MXFP4 GEMM, MLA Decode, and MXFP4 MoE.
                    Each has its own leaderboard, but the top 10 winners are determined by a combined aggregate score across all three.
                    This site pulls from all three leaderboards and calculates that combined ranking so you can see where you actually stand.
                  </p>
                </div>
                <div>
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, marginTop: 0, transition: T }}>
                    How is the score calculated?
                  </h2>
                  <p style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T, margin: 0 }}>
                    Each kernel problem has a maximum point value: MXFP4 GEMM (1,000), MLA Decode (1,250), MXFP4 MoE (1,500).
                    Your score per problem = MaxPoints &times; (1 - rank/20). Your total is the sum of all three.
                  </p>
                </div>
                <div>
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, marginTop: 0, transition: T }}>
                    What does rank 1 = rank 0 mean?
                  </h2>
                  <p style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T, margin: 0 }}>
                    The leaderboard displays ranks starting at 1, but the scoring formula uses 0-indexed ranks.
                    So displayed rank 1 uses rank 0 in the formula, giving full points. Rank 20 (displayed) uses rank 19, giving 5% of max points.
                  </p>
                </div>
                <div>
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, marginTop: 0, transition: T }}>
                    Why are some submissions hidden?
                  </h2>
                  <p style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T, margin: 0 }}>
                    Submissions with runtime under 5 microseconds are filtered out by default as likely harness hacks.
                    You can toggle this with the &quot;hide &lt;5us&quot; button.
                  </p>
                </div>
                <div>
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, marginTop: 0, transition: T }}>
                    How often does the data refresh?
                  </h2>
                  <p style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T, margin: 0 }}>
                    The page revalidates every 60 seconds, pulling fresh data from the GPU Mode API.
                  </p>
                </div>
                <div>
                  <h2 style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, marginTop: 0, transition: T }}>
                    What GPU is this for?
                  </h2>
                  <p style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6, transition: T, margin: 0 }}>
                    All benchmarks run on the AMD Instinct MI355X. Only MI355X rankings are shown.
                  </p>
                </div>
              </div>
          </div>
      </div>

      {/* Loading overlay — covers everything, fades out once ready */}
      {!overlayDone && (
        <div
          aria-hidden="true"
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
