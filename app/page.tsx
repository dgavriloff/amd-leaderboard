import {
  fetchAllLeaderboards,
  calculateAggregateScores,
  getProblemConfigs,
} from "@/lib/scoring";
import Leaderboard from "./components/Leaderboard";

export const revalidate = 60;

export default async function Home() {
  const problems = await fetchAllLeaderboards();
  const entries = calculateAggregateScores(problems);
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
    <div className="min-h-screen bg-[#0f1114] text-[#e0e0e0] font-mono">
      <header className="border-b border-[#2a2e35]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#5eead4] text-sm tracking-wider">AMD</span>
            <span className="text-white text-sm tracking-wider">
              GPU MODE
            </span>
          </div>
          <a
            href="https://www.gpumode.com"
            className="border border-[#2a2e35] px-4 py-1.5 text-xs uppercase tracking-wider text-[#e0e0e0] hover:border-[#5eead4] hover:text-[#5eead4] transition-colors"
          >
            GPU Mode {"->"}
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="border border-[#5eead4] text-[#5eead4] px-2 py-0.5 text-xs uppercase tracking-wider">
              Leaderboard.
            </span>
            <h1 className="text-xl text-white">
              MI355X Kernel Optimization
            </h1>
          </div>
          <p className="text-sm text-[#6b7280] max-w-2xl leading-relaxed">
            Combined rankings across three kernel challenges.
            Score per problem = MaxPoints * (1 - rank/20).
            Top 20 per problem earn points. Total = sum of all three.
          </p>
        </div>
        <Leaderboard
          entries={entries}
          problemConfigs={problemConfigs}
          fetchedAt={fetchedAt}
        />
      </main>
    </div>
  );
}
