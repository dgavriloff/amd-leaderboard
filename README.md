# AMD GPU Mode Combined Leaderboard

Combined leaderboard for the GPU MODE kernel optimization challenge on AMD Instinct MI355X.

GPU MODE runs three separate kernel problems — MXFP4 GEMM, MLA Decode, and MXFP4 MoE — each with its own leaderboard. The top 10 winners are determined by an aggregate score across all three, but there's no official combined view. This site pulls from all three APIs and calculates the combined ranking.

## Scoring

- **MXFP4 GEMM**: 1,000 points max
- **MLA Decode**: 1,250 points max
- **MXFP4 MoE**: 1,500 points max
- Score per problem = `MaxPoints * (1 - rank/20)` (rank is 0-indexed, top 20 earn points)
- Total = sum of all three (max 3,750)
- Submissions under 5us are filtered as likely harness hacks (toggleable)

## Tech Stack

- Next.js 16 (App Router, Server Components)
- Tailwind CSS
- Deployed on Vercel
- Data revalidates every 60 seconds from the GPU Mode API

## Development

```bash
npm install
npm run dev
```

## Disclaimer

This website and its creator have no official affiliation with GPU MODE or AMD.
