"use client";

import { useEffect, useMemo, useState } from "react";
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

const PAGE_SIZE = 10;

const themes = {
  light: {
    pageBg: "#fafafa",
    cardBg: "#ffffff",
    border: "#dddddd",
    borderLight: "#eeeeee",
    text: "#111111",
    textMuted: "#999999",
    textFaint: "#cccccc",
    hover: "#f5f5f5",
    active: "#f0f0f0",
    btnActive: "#eeeeee",
    btnActiveText: "#111111",
  },
  dark: {
    pageBg: "#0f1114",
    cardBg: "#1a1a1a",
    border: "#2a2a2a",
    borderLight: "#222222",
    text: "#e0e0e0",
    textMuted: "#666666",
    textFaint: "#444444",
    hover: "#222222",
    active: "#252525",
    btnActive: "#2a2a2a",
    btnActiveText: "#e0e0e0",
  },
};

const T = "background-color 300ms, color 300ms, border-color 300ms";

export default function Leaderboard({
  rawProblems,
  problemConfigs,
}: {
  rawProblems: RawProblemData[];
  problemConfigs: ProblemConfig[];
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hideUnder5us, setHideUnder5us] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDark(true);
  }, []);
  const [page, setPage] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [closeHovered, setCloseHovered] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqCloseHovered, setFaqCloseHovered] = useState(false);

  const c = dark ? themes.dark : themes.light;

  const allEntries = useMemo(
    () => calculateAggregateScores(rawProblems, hideUnder5us, 20),
    [rawProblems, hideUnder5us]
  );

  const totalPages = Math.max(1, Math.ceil(allEntries.length / PAGE_SIZE));
  const entries = allEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const maxAggregate = problemConfigs.reduce((sum, p) => sum + p.maxPoints, 0);
  // Clamp selectedIndex to current page length
  const effectiveIndex = selectedIndex !== null && selectedIndex < entries.length ? selectedIndex : null;
  const selectedEntry = effectiveIndex !== null ? entries[effectiveIndex] : null;

  return (
    <div
      style={{
        background: c.pageBg,
        transition: T,
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "center" }}>
        {/* Leaderboard */}
        <div style={{ width: "28rem", flexShrink: 0, userSelect: "none" }}>
          <div
            style={{
              border: `1px solid ${c.border}`,
              background: c.cardBg,
              transition: T,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${c.border}`,
                fontSize: 10,
                color: c.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "8px 16px",
                transition: T,
              }}
            >
              <span style={{ width: 40, textAlign: "center", flexShrink: 0 }}>#</span>
              <span style={{ flex: 1 }}>Player</span>
              <span style={{ width: 96, textAlign: "right" }}>Score</span>
            </div>

            {/* Rows */}
            {entries.map((entry, idx) => {
              const isSelected = effectiveIndex === idx;
              const isHovered = hovered === entry.user_name;
              const isLast = idx === entries.length - 1;

              return (
                <div
                  key={entry.user_name}
                  onClick={() => setSelectedIndex(isSelected ? null : idx)}
                  onMouseEnter={() => setHovered(entry.user_name)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 16px",
                    cursor: "pointer",
                    background: isSelected ? c.active : isHovered ? c.hover : "transparent",
                    borderBottom: !isLast ? `1px solid ${c.borderLight}` : "none",
                    transition: T,
                  }}
                >
                  <span style={{ width: 40, textAlign: "center", flexShrink: 0, fontSize: 14, color: c.textMuted, transition: T }}>
                    {String(entry.rank).padStart(2, "0")}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: c.text, transition: T, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.user_name}
                  </span>
                  <span style={{ width: 96, textAlign: "right", fontSize: 12, color: c.textMuted, fontVariantNumeric: "tabular-nums", transition: T }}>
                    {entry.aggregate.toFixed(1)}
                    <span style={{ color: c.textFaint, transition: T }}>/{maxAggregate}</span>
                  </span>
                </div>
              );
            })}

            {/* Toggle buttons */}
            <div style={{ display: "flex", alignItems: "stretch", borderTop: `1px solid ${c.border}`, transition: T }}>
              <button
                onClick={() => { setHideUnder5us(!hideUnder5us); setSelectedIndex(null); }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderTop: "none",
                  borderBottom: "none",
                  borderLeft: "none",
                  borderRight: `1px solid ${c.border}`,
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
                  const next = !dark;
                  setDark(next);
                  localStorage.setItem("theme", next ? "dark" : "light");
                }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  fontSize: 10,
                  borderTop: "none",
                  borderBottom: "none",
                  borderLeft: "none",
                  borderRight: `1px solid ${c.border}`,
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
                onClick={() => setPage((page + 1) % totalPages)}
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
          </div>
        </div>

        {/* Detail card */}
        <div
          style={{
            flexShrink: 0,
            overflow: "hidden",
            transition: "width 300ms, opacity 300ms",
            width: effectiveIndex !== null ? 224 : 0,
            opacity: effectiveIndex !== null ? 1 : 0,
          }}
        >
          {selectedEntry && (
            <div
              style={{
                width: 224,
                border: `1px solid ${c.border}`,
                background: c.cardBg,
                transition: T,
              }}
            >
              <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${c.border}`, transition: T }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: c.text, fontWeight: 700, padding: "8px 16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", transition: T }}>
                  {selectedEntry.user_name}
                </span>
                <button
                  onClick={() => { setSelectedIndex(null); setCloseHovered(false); }}
                  onMouseEnter={() => setCloseHovered(true)}
                  onMouseLeave={() => setCloseHovered(false)}
                  style={{
                    width: 36,
                    borderTop: "none",
                    borderBottom: "none",
                    borderRight: "none",
                    borderLeft: `1px solid ${c.border}`,
                    color: closeHovered ? c.text : c.textFaint,
                    background: closeHovered ? c.hover : "transparent",
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
                  const detail = selectedEntry.problems[p.name];
                  return (
                    <div key={p.name}>
                      <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, transition: T }}>
                        {p.name}
                      </div>
                      {detail ? (
                        <>
                          <div style={{ fontSize: 14, color: c.text, fontWeight: 700, fontVariantNumeric: "tabular-nums", transition: T }}>
                            {formatTime(detail.time)}
                          </div>
                          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2, fontVariantNumeric: "tabular-nums", transition: T }}>
                            rank {detail.rank}
                            <span style={{ color: c.textFaint, marginLeft: 8, transition: T }}>
                              {detail.points.toFixed(1)} pts
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 14, color: c.textFaint, transition: T }}>---</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: `1px solid ${c.borderLight}`, padding: "8px 16px", transition: T }}>
                <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, transition: T }}>
                  Total
                </div>
                <div style={{ fontSize: 14, color: c.text, fontWeight: 700, fontVariantNumeric: "tabular-nums", transition: T }}>
                  {selectedEntry.aggregate.toFixed(1)}
                  <span style={{ color: c.textFaint, fontWeight: 400, transition: T }}>/{maxAggregate}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 24,
        padding: "0 0 20px 0",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        transition: T,
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
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 9,
        fontWeight: 700,
        color: c.textMuted,
        padding: "0 0 8px 0",
        transition: T,
      }}>
        This website and its creator have no official affiliation with GPU MODE or AMD.
      </div>

      {/* FAQ Modal */}
      {faqOpen && (
        <div
          onClick={() => setFaqOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              maxHeight: "80vh",
              overflow: "auto",
              background: c.cardBg,
              border: `1px solid ${c.border}`,
              transition: T,
            }}
          >
            <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${c.border}`, transition: T }}>
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
                  borderLeft: `1px solid ${c.border}`,
                  color: faqCloseHovered ? c.text : c.textFaint,
                  background: faqCloseHovered ? c.hover : "transparent",
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
              <div style={{ borderTop: `1px solid ${c.borderLight}`, paddingTop: 16, marginTop: 4, transition: T }}>
                <div style={{ fontSize: 10, color: c.textFaint, lineHeight: 1.6, transition: T }}>
                  This website and its creator have no official affiliation with GPU MODE.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
