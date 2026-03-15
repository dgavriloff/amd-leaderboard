"use client";

import { AggregateEntry, ProblemConfig } from "@/lib/scoring";

const RANK_ACCENTS: Record<number, string> = {
  1: "border-l-[#5eead4]",
  2: "border-l-[#94a3b8]",
  3: "border-l-[#d97706]",
};

const RANK_COLORS: Record<number, string> = {
  1: "text-[#5eead4]",
  2: "text-[#94a3b8]",
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
  const maxAggregate = problemConfigs.reduce((sum, p) => sum + p.maxPoints, 0);

  return (
    <div className="w-full">
      <div className="border border-[#2a2e35]">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-[#2a2e35] text-[#6b7280] text-xs uppercase tracking-wider">
              <th className="px-4 py-3 w-14 text-center">#</th>
              <th className="px-4 py-3 text-left">Player</th>
              {problemConfigs.map((p) => (
                <th
                  key={p.name}
                  className="px-4 py-3 text-right border-l border-[#2a2e35]"
                >
                  <div>{p.name}</div>
                  <div className="text-[10px] text-[#3f4550] font-normal normal-case mt-0.5">
                    /{p.maxPoints.toLocaleString()}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right border-l border-[#2a2e35]">
                <div>Total</div>
                <div className="text-[10px] text-[#3f4550] font-normal normal-case mt-0.5">
                  /{maxAggregate.toLocaleString()}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const accent =
                RANK_ACCENTS[entry.rank] ?? "border-l-transparent";
              const rankColor = RANK_COLORS[entry.rank] ?? "text-[#3f4550]";
              const isLast = i === entries.length - 1;
              return (
                <tr
                  key={entry.user_name}
                  className={`border-l-2 ${accent} ${
                    !isLast ? "border-b border-[#1e2127]" : ""
                  } hover:bg-[#1a1d23] transition-colors`}
                >
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${rankColor}`}>
                      {String(entry.rank).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#e0e0e0]">
                    {entry.user_name}
                  </td>
                  {problemConfigs.map((p) => {
                    const pts = entry.problemScores[p.name] ?? 0;
                    const pct = pts / p.maxPoints;
                    return (
                      <td
                        key={p.name}
                        className="px-4 py-3 text-right border-l border-[#1e2127]"
                      >
                        <span
                          className={
                            pts > 0
                              ? pct >= 0.9
                                ? "text-[#5eead4]"
                                : pct >= 0.7
                                  ? "text-[#e0e0e0]"
                                  : "text-[#6b7280]"
                              : "text-[#2a2e35]"
                          }
                        >
                          {pts > 0 ? pts.toFixed(1) : "---"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right border-l border-[#2a2e35] text-white font-bold">
                    {entry.aggregate.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] text-[#3f4550] uppercase tracking-wider">
        <span>
          Score = MaxPoints * (1 - rank/20)
        </span>
        <span>
          Fetched {fetchedAt} / revalidates 60s
        </span>
      </div>
    </div>
  );
}
