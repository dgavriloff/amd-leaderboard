"use client";

import { useState } from "react";
import { AggregateEntry, ProblemConfig } from "@/lib/scoring";


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
  fetchedAt,
}: {
  entries: AggregateEntry[];
  problemConfigs: ProblemConfig[];
  fetchedAt: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const maxAggregate = problemConfigs.reduce((sum, p) => sum + p.maxPoints, 0);

  return (
    <div className="w-full select-none">
      <div className="border border-[#252525]">
        {/* Header */}
        <div className="flex items-center border-b border-[#252525] text-[10px] text-[#555] uppercase tracking-wider px-4 py-2.5">
          <span className="w-12 text-center shrink-0">#</span>
          <span className="flex-1">Player</span>
          <span className="w-28 text-right text-[#444]">
            Score
          </span>
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
      <div className="mt-4 flex items-center justify-between text-[10px] text-[#333] uppercase tracking-wider">
        <span>Score = MaxPoints * (1 - rank/20), rank 0-indexed</span>
        <span>Fetched {fetchedAt} / revalidates 60s</span>
      </div>
    </div>
  );
}
