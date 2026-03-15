"use client";

import { AggregateEntry, ProblemConfig } from "@/lib/scoring";

const MEDAL_COLORS: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-amber-600",
};

const ROW_ACCENTS: Record<number, string> = {
  1: "border-l-yellow-400",
  2: "border-l-gray-300",
  3: "border-l-amber-600",
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
    <div className="w-full max-w-6xl mx-auto">
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-zinc-400">
              <th className="px-4 py-3 w-16 text-center">#</th>
              <th className="px-4 py-3">Player</th>
              {problemConfigs.map((p) => (
                <th key={p.name} className="px-4 py-3 text-right">
                  <div>{p.name}</div>
                  <div className="text-[10px] text-zinc-500 font-normal normal-case">
                    max {p.maxPoints.toLocaleString()}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right">
                <div>Total</div>
                <div className="text-[10px] text-zinc-500 font-normal normal-case">
                  max {maxAggregate.toLocaleString()}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.map((entry) => {
              const accent = ROW_ACCENTS[entry.rank] ?? "border-l-transparent";
              const medal = MEDAL_COLORS[entry.rank];
              return (
                <tr
                  key={entry.user_name}
                  className={`border-l-2 ${accent} transition-colors hover:bg-white/[0.03]`}
                >
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${medal ?? "text-zinc-500"}`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-100">
                    {entry.user_name}
                  </td>
                  {problemConfigs.map((p) => {
                    const pts = entry.problemScores[p.name] ?? 0;
                    return (
                      <td
                        key={p.name}
                        className="px-4 py-3 text-right font-mono tabular-nums text-zinc-400"
                      >
                        {pts > 0 ? pts.toFixed(1) : "-"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-emerald-400">
                    {entry.aggregate.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-zinc-600 text-right">
        Data fetched {fetchedAt} &middot; Refreshes every 60s &middot; Score =
        MaxPoints &times; (1 &minus; rank/20)
      </p>
    </div>
  );
}
