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
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            AMD GPU Mode Leaderboard
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Combined rankings across 3 MI355X kernel challenges.
            Score per problem = MaxPoints &times; (1 &minus; rank/20). Top 20
            per problem earn points. Total = sum of all three.
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
