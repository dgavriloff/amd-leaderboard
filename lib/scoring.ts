export interface RankingEntry {
  user_name: string;
  score: number;
  rank: number;
  submission_time: string;
  submission_count: number;
}

export interface ProblemConfig {
  id: number;
  name: string;
  maxPoints: number;
}

export interface AggregateEntry {
  rank: number;
  user_name: string;
  problemScores: Record<string, number>; // points per problem
  aggregate: number; // sum of points
  latestSubmission: string;
}

const PROBLEMS: ProblemConfig[] = [
  { id: 763, name: "MXFP4 GEMM", maxPoints: 1000 },
  { id: 765, name: "MLA Decode", maxPoints: 1250 },
  { id: 764, name: "MXFP4 MoE", maxPoints: 1500 },
];

const TOP_N = 20;

async function fetchLeaderboard(id: number): Promise<RankingEntry[]> {
  const res = await fetch(`https://www.gpumode.com/api/leaderboard/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch leaderboard ${id}: ${res.status}`);
  }

  const json = await res.json();
  const rankings: RankingEntry[] = json.data.rankings.MI355X ?? [];

  return rankings.filter((e) => e.rank <= TOP_N);
}

interface ProblemResult {
  config: ProblemConfig;
  entries: RankingEntry[];
}

export async function fetchAllLeaderboards(): Promise<ProblemResult[]> {
  return Promise.all(
    PROBLEMS.map(async (p) => ({
      config: p,
      entries: await fetchLeaderboard(p.id),
    }))
  );
}

function calculatePoints(apiRank: number, maxPoints: number): number {
  // API rank is 1-indexed, formula uses 0-indexed
  const rank = apiRank - 1;
  return maxPoints * (1 - rank / TOP_N);
}

export function calculateAggregateScores(
  problems: ProblemResult[]
): AggregateEntry[] {
  // Build map: user_name -> { problemName -> best entry }
  const userEntries = new Map<string, Map<string, { entry: RankingEntry; config: ProblemConfig }>>();

  for (const problem of problems) {
    for (const entry of problem.entries) {
      if (!userEntries.has(entry.user_name)) {
        userEntries.set(entry.user_name, new Map());
      }
      const userMap = userEntries.get(entry.user_name)!;
      const existing = userMap.get(problem.config.name);
      // Keep best (lowest) rank per problem per user
      if (!existing || entry.rank < existing.entry.rank) {
        userMap.set(problem.config.name, { entry, config: problem.config });
      }
    }
  }

  const problemNames = PROBLEMS.map((p) => p.name);
  const aggregates: AggregateEntry[] = [];

  for (const [userName, scoreMap] of userEntries) {
    const problemScores: Record<string, number> = {};
    let total = 0;
    let latestTime = "";

    for (const name of problemNames) {
      const data = scoreMap.get(name);
      if (data) {
        const pts = calculatePoints(data.entry.rank, data.config.maxPoints);
        problemScores[name] = pts;
        total += pts;
        if (data.entry.submission_time > latestTime) {
          latestTime = data.entry.submission_time;
        }
      } else {
        problemScores[name] = 0;
      }
    }

    aggregates.push({
      rank: 0,
      user_name: userName,
      problemScores,
      aggregate: total,
      latestSubmission: latestTime,
    });
  }

  // Sort descending (higher = better), tiebreak by earliest latest submission
  aggregates.sort((a, b) => {
    if (b.aggregate !== a.aggregate) return b.aggregate - a.aggregate;
    return a.latestSubmission.localeCompare(b.latestSubmission);
  });

  return aggregates.slice(0, 10).map((entry, i) => ({
    ...entry,
    rank: i + 1,
  }));
}

export function getProblemConfigs(): ProblemConfig[] {
  return PROBLEMS;
}
