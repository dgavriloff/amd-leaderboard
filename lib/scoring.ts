export interface RankingEntry {
  user_name: string;
  score: number; // runtime (geometric mean)
  rank: number;
  submission_time: string;
  submission_count: number;
}

export interface ProblemConfig {
  id: number;
  name: string;
  maxPoints: number;
}

export interface ProblemDetail {
  rank: number; // 1-indexed display rank
  time: number; // raw runtime from API
  points: number;
}

export interface AggregateEntry {
  rank: number;
  user_name: string;
  problems: Record<string, ProblemDetail | null>;
  aggregate: number;
  latestSubmission: string;
}

export interface SkippedEntry {
  user_name: string;
  problem: string;
  time: number;
  originalRank: number;
}

export interface LeaderboardResult {
  entries: AggregateEntry[];
  skipped: SkippedEntry[];
}

const PROBLEMS: ProblemConfig[] = [
  { id: 763, name: "MXFP4 GEMM", maxPoints: 1000 },
  { id: 765, name: "MLA Decode", maxPoints: 1250 },
  { id: 764, name: "MXFP4 MoE", maxPoints: 1500 },
];

const TOP_N = 20;
const MIN_TIME = 5e-6; // 5 microseconds

async function fetchLeaderboard(id: number): Promise<RankingEntry[]> {
  const res = await fetch(`https://www.gpumode.com/api/leaderboard/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch leaderboard ${id}: ${res.status}`);
  }

  const json = await res.json();
  return json.data.rankings.MI355X ?? [];
}

interface ProblemResult {
  config: ProblemConfig;
  entries: RankingEntry[];
  skipped: SkippedEntry[];
}

export async function fetchAllLeaderboards(): Promise<ProblemResult[]> {
  const raw = await Promise.all(
    PROBLEMS.map(async (p) => ({
      config: p,
      allEntries: await fetchLeaderboard(p.id),
    }))
  );

  return raw.map(({ config, allEntries }) => {
    const skipped: SkippedEntry[] = [];
    const valid: RankingEntry[] = [];

    for (const entry of allEntries) {
      if (entry.score < MIN_TIME) {
        skipped.push({
          user_name: entry.user_name,
          problem: config.name,
          time: entry.score,
          originalRank: entry.rank,
        });
      } else {
        valid.push(entry);
      }
    }

    // Re-rank valid entries by score ascending (fastest first)
    valid.sort((a, b) => a.score - b.score);
    const reranked = valid.slice(0, TOP_N).map((e, i) => ({
      ...e,
      rank: i + 1, // 1-indexed
    }));

    return { config, entries: reranked, skipped };
  });
}

export function calculateAggregateScores(
  problems: ProblemResult[]
): LeaderboardResult {
  const allSkipped = problems.flatMap((p) => p.skipped);

  // Build map: user_name -> { problemName -> best entry }
  const userEntries = new Map<
    string,
    Map<string, { entry: RankingEntry; config: ProblemConfig }>
  >();

  for (const problem of problems) {
    for (const entry of problem.entries) {
      if (!userEntries.has(entry.user_name)) {
        userEntries.set(entry.user_name, new Map());
      }
      const userMap = userEntries.get(entry.user_name)!;
      const existing = userMap.get(problem.config.name);
      if (!existing || entry.rank < existing.entry.rank) {
        userMap.set(problem.config.name, { entry, config: problem.config });
      }
    }
  }

  const problemNames = PROBLEMS.map((p) => p.name);
  const aggregates: AggregateEntry[] = [];

  for (const [userName, scoreMap] of userEntries) {
    const problemDetails: Record<string, ProblemDetail | null> = {};
    let total = 0;
    let latestTime = "";

    for (const name of problemNames) {
      const data = scoreMap.get(name);
      if (data) {
        // Display rank is 1-indexed, formula uses 0-indexed (rank - 1)
        const displayRank = data.entry.rank;
        const formulaRank = displayRank - 1;
        const pts = data.config.maxPoints * (1 - formulaRank / TOP_N);
        problemDetails[name] = {
          rank: displayRank,
          time: data.entry.score,
          points: pts,
        };
        total += pts;
        if (data.entry.submission_time > latestTime) {
          latestTime = data.entry.submission_time;
        }
      } else {
        problemDetails[name] = null;
      }
    }

    aggregates.push({
      rank: 0,
      user_name: userName,
      problems: problemDetails,
      aggregate: total,
      latestSubmission: latestTime,
    });
  }

  aggregates.sort((a, b) => {
    if (b.aggregate !== a.aggregate) return b.aggregate - a.aggregate;
    return a.latestSubmission.localeCompare(b.latestSubmission);
  });

  const entries = aggregates.slice(0, 10).map((entry, i) => ({
    ...entry,
    rank: i + 1,
  }));

  return { entries, skipped: allSkipped };
}

export function getProblemConfigs(): ProblemConfig[] {
  return PROBLEMS;
}
