"use client";

import { useState } from "react";
import { AggregateEntry, ProblemConfig, SkippedEntry } from "@/lib/scoring";

function formatTime(seconds: number): string {
  if (seconds < 1e-3) {
    return `${(seconds * 1e6).toFixed(2)} us`;
  }
  if (seconds < 1) {
    return `${(seconds * 1e3).toFixed(2)} ms`;
  }
  return `${seconds.toFixed(4)} s`;
}

export default function Leaderboard({
  entries,
  problemConfigs,
  skipped,
  fetchedAt,
}: {
  entries: AggregateEntry[];
  problemConfigs: ProblemConfig[];
  skipped: SkippedEntry[];
  fetchedAt: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [skippedOpen, setSkippedOpen] = useState(false);
  const maxAggregate = problemConfigs.reduce((sum, p) => sum + p.maxPoints, 0);

  return (
    <div className="w-full select-none">
      <div className="border border-[#252525]">
        {/* Header */}
        <div className="flex items-center border-b border-[#252525] text-[10px] text-[#555] uppercase tracking-wider px-4 py-2.5">
          <span className="w-12 text-center shrink-0">#</span>
          <span className="flex-1">Player</span>
          <span className="w-28 text-right text-[#444]">Score</span>
        </div>

        {/* Rows */}
        {entries.map((entry) => {
          const isOpen = expanded === entry.user_name;

          return (
            <div key={entry.user_name}>
              <div
                onClick={() =>
                  setExpanded(isOpen ? null : entry.user_name)
                }
                className={`flex items-center px-4 py-3 cursor-pointer transition-colors hover:bg-[#1a1d23] ${
                  isOpen ? "bg-[#1a1d23]" : ""
                } ${entry.rank < entries.length ? "border-b border-[#1e1e1e]" : ""}`}
              >
                <span className="w-12 text-center shrink-0 font-bold text-sm text-[#555]">
                  {String(entry.rank).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm text-[#d4d4d4]">
                  {entry.user_name}
                </span>
                <span className="w-28 text-right text-xs text-[#555] tabular-nums">
                  {entry.aggregate.toFixed(1)}
                  <span className="text-[#333]">/{maxAggregate}</span>
                </span>
                <span
                  className={`ml-3 text-[#555] text-xs transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  v
                </span>
              </div>

              {/* Drawer */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-60" : "max-h-0"
                }`}
              >
                <div className="bg-[#161819] border-t border-[#252525] px-4 py-4 border-b border-[#1e1e1e]">
                  <div className="grid grid-cols-3 gap-6 ml-12">
                    {problemConfigs.map((p) => {
                      const detail = entry.problems[p.name];
                      return (
                        <div key={p.name}>
                          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
                            {p.name}
                          </div>
                          {detail ? (
                            <>
                              <div className="text-sm text-[#d4d4d4] font-bold tabular-nums">
                                {formatTime(detail.time)}
                              </div>
                              <div className="text-xs text-[#555] mt-1 tabular-nums">
                                rank {detail.rank}
                                <span className="text-[#333] ml-2">
                                  {detail.points.toFixed(1)} pts
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-[#333]">---</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key */}
      <div className="mt-4 text-[10px] text-[#444] leading-relaxed">
        <span className="text-[#555]">*</span> Displayed rank 1 corresponds to
        rank 0 in the scoring formula. Score = MaxPoints * (1 - rank/20) where
        rank is 0-indexed.
      </div>

      {/* Skipped submissions */}
      {skipped.length > 0 && (
        <div className="mt-4 border border-[#252525]">
          <div
            onClick={() => setSkippedOpen(!skippedOpen)}
            className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[#1a1d23] transition-colors"
          >
            <span className="text-[10px] text-[#555] uppercase tracking-wider">
              Skipped submissions ({skipped.length})
            </span>
            <span
              className={`text-[#555] text-xs transition-transform ${
                skippedOpen ? "rotate-180" : ""
              }`}
            >
              v
            </span>
          </div>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              skippedOpen ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="border-t border-[#252525] px-4 py-3 bg-[#161819]">
              <p className="text-[10px] text-[#444] mb-3">
                Submissions with runtime &lt; 5us are excluded as likely harness
                hacks.
              </p>
              <div className="space-y-1.5">
                {skipped.map((s, i) => (
                  <div
                    key={`${s.user_name}-${s.problem}-${i}`}
                    className="flex items-center text-xs"
                  >
                    <span className="text-[#d4d4d4] w-48 truncate">
                      {s.user_name}
                    </span>
                    <span className="text-[#555] flex-1">{s.problem}</span>
                    <span className="text-[#555] tabular-nums">
                      {formatTime(s.time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-right text-[10px] text-[#333] uppercase tracking-wider">
        Fetched {fetchedAt} / revalidates 60s
      </div>
    </div>
  );
}
