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
    <div className="min-h-screen flex items-center justify-center p-6 font-mono">
      <Leaderboard
        entries={entries}
        problemConfigs={problemConfigs}
        skipped={skipped}
        fetchedAt={fetchedAt}
      />
    </div>
  );
}
