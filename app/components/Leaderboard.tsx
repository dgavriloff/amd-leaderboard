"use client";

import { useState } from "react";
import { AggregateEntry, ProblemConfig } from "@/lib/scoring";

const RANK_ACCENTS: Record<number, string> = {
  1: "border-l-[#5eead4]",
  2: "border-l-[#999]",
  3: "border-l-[#d97706]",
};

const RANK_COLORS: Record<number, string> = {
  1: "text-[#5eead4]",
  2: "text-[#999]",
  3: "text-[#d97706]",
};

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
          <span className="w-28 text-right">
            Score
            <span className="text-[#333] ml-1">/{maxAggregate}</span>
          </span>
        </div>

        {/* Rows */}
        {entries.map((entry) => {
          const isOpen = expanded === entry.user_name;
          const accent =
            RANK_ACCENTS[entry.rank] ?? "border-l-transparent";
          const rankColor = RANK_COLORS[entry.rank] ?? "text-[#444]";

          return (
            <div key={entry.user_name}>
              <div
                onClick={() =>
                  setExpanded(isOpen ? null : entry.user_name)
                }
                className={`flex items-center px-4 py-3 border-l-2 ${accent} cursor-pointer transition-colors hover:bg-[#1a1d23] ${
                  isOpen ? "bg-[#1a1d23]" : ""
                } ${entry.rank < entries.length ? "border-b border-[#1e1e1e]" : ""}`}
              >
                <span
                  className={`w-12 text-center shrink-0 font-bold text-sm ${rankColor}`}
                >
                  {String(entry.rank).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm text-[#d4d4d4]">
                  {entry.user_name}
                </span>
                <span className="w-28 text-right text-sm text-white font-bold tabular-nums">
                  {entry.aggregate.toFixed(1)}
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
                <div className="bg-[#161819] border-t border-[#252525] px-4 py-3 border-b border-[#1e1e1e]">
                  <div className="grid grid-cols-3 gap-4 ml-12">
                    {problemConfigs.map((p) => {
                      const pts = entry.problemScores[p.name] ?? 0;
                      const pct = pts / p.maxPoints;
                      return (
                        <div key={p.name}>
                          <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
                            {p.name}
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                pts > 0
                                  ? pct >= 0.9
                                    ? "text-[#5eead4]"
                                    : pct >= 0.7
                                      ? "text-[#d4d4d4]"
                                      : "text-[#777]"
                                  : "text-[#333]"
                              }`}
                            >
                              {pts > 0 ? pts.toFixed(1) : "---"}
                            </span>
                            <span className="text-[10px] text-[#333]">
                              /{p.maxPoints}
                            </span>
                          </div>
                          {/* Score bar */}
                          <div className="mt-1.5 h-px bg-[#252525] w-full">
                            <div
                              className="h-px bg-[#5eead4] transition-all duration-300"
                              style={{ width: `${pct * 100}%` }}
                            />
                          </div>
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
        <span>Score = MaxPoints * (1 - rank/20)</span>
        <span>Fetched {fetchedAt} / revalidates 60s</span>
      </div>
    </div>
  );
}
