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

export interface ProblemDetail {
  rank: number;
  time: number;
  points: number;
}

export interface AggregateEntry {
  rank: number;
  user_name: string;
  problems: Record<string, ProblemDetail | null>;
  aggregate: number;
  latestSubmission: string;
}

export interface RawProblemData {
  config: ProblemConfig;
  entries: RankingEntry[];
}

const PROBLEMS: ProblemConfig[] = [
  { id: 763, name: "MXFP4 GEMM", maxPoints: 1000 },
  { id: 765, name: "MLA Decode", maxPoints: 1250 },
  { id: 764, name: "MXFP4 MoE", maxPoints: 1500 },
];

const TOP_N = 20;
const MIN_TIME = 5e-6;

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

export async function fetchAllLeaderboards(): Promise<RawProblemData[]> {
  return Promise.all(
    PROBLEMS.map(async (p) => ({
      config: p,
      entries: await fetchLeaderboard(p.id),
    }))
  );
}

export function calculateAggregateScores(
  rawProblems: RawProblemData[],
  hideUnder5us: boolean,
  topN: number
): AggregateEntry[] {
  // Filter and re-rank each problem
  const problems = rawProblems.map(({ config, entries }) => {
    let valid = entries;
    if (hideUnder5us) {
      valid = valid.filter((e) => e.score >= MIN_TIME);
    }
    // Sort by score ascending (fastest first), take top 20 for scoring
    valid = [...valid].sort((a, b) => a.score - b.score);
    const reranked = valid.slice(0, TOP_N).map((e, i) => ({
      ...e,
      rank: i + 1,
    }));
    return { config, entries: reranked };
  });

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

  const problemNames = rawProblems.map((p) => p.config.name);
  const aggregates: AggregateEntry[] = [];

  for (const [userName, scoreMap] of userEntries) {
    const problemDetails: Record<string, ProblemDetail | null> = {};
    let total = 0;
    let latestTime = "";

    for (const name of problemNames) {
      const data = scoreMap.get(name);
      if (data) {
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

  return aggregates.slice(0, topN).map((entry, i) => ({
    ...entry,
    rank: i + 1,
  }));
}

export function getProblemConfigs(): ProblemConfig[] {
  return PROBLEMS;
}
