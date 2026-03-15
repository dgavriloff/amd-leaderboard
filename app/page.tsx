import { fetchAllLeaderboards, getProblemConfigs } from "@/lib/scoring";
import Leaderboard from "./components/Leaderboard";
import fs from "fs";
import path from "path";

export const revalidate = 60;

function getImages(folder: string): string[] {
  const dir = path.join(process.cwd(), "public", folder);
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map((f) => `/${folder}/${f}`);
  } catch {
    return [];
  }
}

export default async function Home() {
  const rawProblems = await fetchAllLeaderboards();
  const problemConfigs = getProblemConfigs();
  const lightImages = getImages("light");
  const darkImages = getImages("dark");

  return (
    <Leaderboard
      rawProblems={rawProblems}
      problemConfigs={problemConfigs}
      lightImages={lightImages}
      darkImages={darkImages}
    />
  );
}
