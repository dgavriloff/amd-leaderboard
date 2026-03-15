import { fetchAllLeaderboards, getProblemConfigs } from "@/lib/scoring";
import Leaderboard from "./components/Leaderboard";

export const revalidate = 60;

export default async function Home() {
  const rawProblems = await fetchAllLeaderboards();
  const problemConfigs = getProblemConfigs();

  return <Leaderboard rawProblems={rawProblems} problemConfigs={problemConfigs} />;
}
