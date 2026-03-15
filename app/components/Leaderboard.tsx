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
    <div className="w-full max-w-2xl select-none">
      {/* Title */}
      <h1 className="text-lg font-bold mb-1">AMD GPU Mode Leaderboard</h1>
      <p className="text-[11px] text-[#888] mb-6">
        MI355X Kernel Optimization — click a row for details
      </p>

      {/* Table */}
      <div className="border border-[#ddd] bg-white">
        <div className="flex items-center border-b border-[#ddd] text-[10px] text-[#999] uppercase tracking-wider px-4 py-2">
          <span className="w-10 text-center shrink-0">#</span>
          <span className="flex-1">Player</span>
          <span className="w-24 text-right">Score</span>
        </div>

        {entries.map((entry) => {
          const isOpen = expanded === entry.user_name;

          return (
            <div key={entry.user_name}>
              <div
                onClick={() =>
                  setExpanded(isOpen ? null : entry.user_name)
                }
                className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors hover:bg-[#f5f5f5] ${
                  isOpen ? "bg-[#f5f5f5]" : ""
                } ${entry.rank < entries.length ? "border-b border-[#eee]" : ""}`}
              >
                <span className="w-10 text-center shrink-0 text-sm text-[#999]">
                  {String(entry.rank).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm text-[#111]">
                  {entry.user_name}
                </span>
                <span className="w-24 text-right text-xs text-[#999] tabular-nums">
                  {entry.aggregate.toFixed(1)}
                  <span className="text-[#ccc]">/{maxAggregate}</span>
                </span>
                <span
                  className={`ml-2 text-[#bbb] text-[10px] transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  v
                </span>
              </div>

              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-60" : "max-h-0"
                }`}
              >
                <div className="bg-[#f9f9f9] border-t border-[#eee] px-4 py-3 border-b border-[#eee]">
                  <div className="grid grid-cols-3 gap-4 ml-10">
                    {problemConfigs.map((p) => {
                      const detail = entry.problems[p.name];
                      return (
                        <div key={p.name}>
                          <div className="text-[10px] text-[#aaa] uppercase tracking-wider mb-1.5">
                            {p.name}
                          </div>
                          {detail ? (
                            <>
                              <div className="text-sm text-[#111] font-bold tabular-nums">
                                {formatTime(detail.time)}
                              </div>
                              <div className="text-[11px] text-[#999] mt-0.5 tabular-nums">
                                rank {detail.rank}
                                <span className="text-[#ccc] ml-2">
                                  {detail.points.toFixed(1)} pts
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-[#ccc]">---</div>
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
      <div className="mt-3 text-[10px] text-[#bbb] leading-relaxed">
        * Rank 1 = rank 0 in formula. Score = MaxPoints * (1 - rank/20).
      </div>

      {/* Skipped */}
      {skipped.length > 0 && (
        <div className="mt-3 border border-[#ddd] bg-white">
          <div
            onClick={() => setSkippedOpen(!skippedOpen)}
            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
          >
            <span className="text-[10px] text-[#999] uppercase tracking-wider">
              Skipped submissions ({skipped.length})
            </span>
            <span
              className={`text-[#bbb] text-[10px] transition-transform ${
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
            <div className="border-t border-[#eee] px-4 py-3 bg-[#f9f9f9]">
              <p className="text-[10px] text-[#bbb] mb-2">
                Runtime &lt; 5us — excluded as likely harness hacks.
              </p>
              <div className="space-y-1">
                {skipped.map((s, i) => (
                  <div
                    key={`${s.user_name}-${s.problem}-${i}`}
                    className="flex items-center text-[11px]"
                  >
                    <span className="text-[#111] w-40 truncate">
                      {s.user_name}
                    </span>
                    <span className="text-[#999] flex-1">{s.problem}</span>
                    <span className="text-[#999] tabular-nums">
                      {formatTime(s.time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 text-right text-[10px] text-[#ccc] uppercase tracking-wider">
        {fetchedAt}
      </div>
    </div>
  );
}
