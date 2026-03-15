import {
  fetchAllLeaderboards,
  calculateAggregateScores,
  getProblemConfigs,
} from "@/lib/scoring";
import Leaderboard from "./components/Leaderboard";

export const revalidate = 60;

export default async function Home() {
  const problems = await fetchAllLeaderboards();
  const { entries, skipped } = calculateAggregateScores(problems);
  const problemConfigs = getProblemConfigs();
  const fetchedAt = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });

  return (
    <div className="min-h-screen bg-[#0f1114] text-[#d4d4d4] font-mono">
      <header className="border-b border-[#252525]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#5eead4] text-sm tracking-wider">AMD</span>
            <span className="text-white text-sm tracking-wider">
              GPU MODE
            </span>
          </div>
          <a
            href="https://www.gpumode.com"
            className="border border-[#252525] px-4 py-1.5 text-xs uppercase tracking-wider text-[#d4d4d4] hover:border-[#5eead4] hover:text-[#5eead4] transition-colors"
          >
            GPU Mode {"->"}
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="border border-[#5eead4] text-[#5eead4] px-2 py-0.5 text-xs uppercase tracking-wider">
              Leaderboard.
            </span>
            <h1 className="text-xl text-white">
              MI355X Kernel Optimization
            </h1>
          </div>
          <p className="text-xs text-[#555] max-w-xl leading-relaxed">
            Combined rankings across three kernel challenges.
            Click a row to see per-problem breakdown.
          </p>
        </div>
        <Leaderboard
          entries={entries}
          problemConfigs={problemConfigs}
          skipped={skipped}
          fetchedAt={fetchedAt}
        />
      </main>
    </div>
  );
}
