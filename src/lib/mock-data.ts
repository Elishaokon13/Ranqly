export type ContestPhase = "submission" | "scoring" | "disputes" | "voting" | "judging" | "finalization" | "completed";
export type ContestCategory = "content" | "design" | "dev" | "research" | "other";

export interface Contest {
  id: string;
  title: string;
  description: string;
  organizer: {
    name: string;
    logo: string;
    verified: boolean;
  };
  category: ContestCategory;
  phase: ContestPhase;
  prizePool: string;
  prizeAmount: number;
  currency: string;
  winnersCount: number;
  submissionsCount: number;
  maxSubmissions: number;
  daysRemaining: number;
  startDate: string;
  endDate: string;
  bannerColor: string;
  /** Optional banner image URL or path. Falls back to bannerColor gradient if missing. */
  bannerImage?: string;
  hot: boolean;
  preTge: boolean;
}

export const MOCK_CONTESTS: Contest[] = [
  {
    id: "best-defi-tutorial",
    title: "Best DeFi Tutorial",
    description: "Create the most comprehensive and beginner-friendly DeFi tutorial. Explain yield farming, liquidity pools, or lending protocols.",
    organizer: { name: "Aave", logo: "A", verified: true },
    category: "content",
    phase: "voting",
    prizePool: "2M USDC",
    prizeAmount: 2000000,
    currency: "USDC",
    winnersCount: 100,
    submissionsCount: 847,
    maxSubmissions: 1000,
    daysRemaining: 8,
    startDate: "2026-01-15",
    endDate: "2026-02-22",
    bannerColor: "from-primary-500 to-primary-700",
    hot: true,
    preTge: false,
  },
  {
    id: "ai-art-competition",
    title: "AI Art Competition",
    description: "Showcase your best AI-generated artwork. Any style, any tool. Winners selected by community vote and expert judges.",
    organizer: { name: "Midjourney", logo: "M", verified: true },
    category: "design",
    phase: "judging",
    prizePool: "500K USDC",
    prizeAmount: 500000,
    currency: "USDC",
    winnersCount: 50,
    submissionsCount: 1234,
    maxSubmissions: 2000,
    daysRemaining: 3,
    startDate: "2026-01-20",
    endDate: "2026-02-18",
    bannerColor: "from-accent-500 to-accent-700",
    hot: true,
    preTge: false,
  },
  {
    id: "smart-contract-audit",
    title: "Smart Contract Security Audit",
    description: "Find bugs and vulnerabilities in our latest smart contracts. Top auditors earn bounties based on severity of findings.",
    organizer: { name: "Chainlink", logo: "C", verified: true },
    category: "dev",
    phase: "submission",
    prizePool: "1M USDC",
    prizeAmount: 1000000,
    currency: "USDC",
    winnersCount: 25,
    submissionsCount: 156,
    maxSubmissions: 500,
    daysRemaining: 14,
    startDate: "2026-02-01",
    endDate: "2026-03-01",
    bannerColor: "from-blue-500 to-blue-700",
    bannerImage: "/images/contests/smart-contract-audit.png",
    hot: false,
    preTge: false,
  },
  {
    id: "dao-governance-research",
    title: "DAO Governance Research",
    description: "Submit original research on DAO governance mechanisms. We're looking for novel voting systems, delegation patterns, and treasury management.",
    organizer: { name: "Aragon", logo: "AR", verified: true },
    category: "research",
    phase: "submission",
    prizePool: "250K USDC",
    prizeAmount: 250000,
    currency: "USDC",
    winnersCount: 20,
    submissionsCount: 45,
    maxSubmissions: 200,
    daysRemaining: 21,
    startDate: "2026-02-10",
    endDate: "2026-03-10",
    bannerColor: "from-purple-500 to-purple-700",
    bannerImage: "/images/contests/dao-governance-research.png",
    hot: false,
    preTge: true,
  },
  {
    id: "nft-marketplace-design",
    title: "NFT Marketplace UI Design",
    description: "Design a next-gen NFT marketplace interface. Focus on discoverability, creator tools, and collector experience.",
    organizer: { name: "OpenSea", logo: "OS", verified: true },
    category: "design",
    phase: "scoring",
    prizePool: "750K USDC",
    prizeAmount: 750000,
    currency: "USDC",
    winnersCount: 30,
    submissionsCount: 312,
    maxSubmissions: 500,
    daysRemaining: 0,
    startDate: "2026-01-10",
    endDate: "2026-02-10",
    bannerColor: "from-sky-500 to-indigo-600",
    hot: false,
    preTge: false,
  },
  {
    id: "layer2-explainer",
    title: "Layer 2 Scaling Explainer",
    description: "Create clear, visual content explaining Layer 2 scaling solutions. Rollups, sidechains, state channels — make it accessible.",
    organizer: { name: "Optimism", logo: "OP", verified: true },
    category: "content",
    phase: "completed",
    prizePool: "100K USDC",
    prizeAmount: 100000,
    currency: "USDC",
    winnersCount: 50,
    submissionsCount: 423,
    maxSubmissions: 500,
    daysRemaining: 0,
    startDate: "2025-12-01",
    endDate: "2026-01-15",
    bannerColor: "from-red-500 to-red-700",
    hot: false,
    preTge: false,
  },
  {
    id: "web3-onboarding-flow",
    title: "Web3 Onboarding UX",
    description: "Design the best onboarding experience for Web3 newcomers. Simplify wallet creation, token swaps, and dApp interactions.",
    organizer: { name: "Rainbow", logo: "R", verified: true },
    category: "design",
    phase: "submission",
    prizePool: "300K USDC",
    prizeAmount: 300000,
    currency: "USDC",
    winnersCount: 15,
    submissionsCount: 89,
    maxSubmissions: 300,
    daysRemaining: 18,
    startDate: "2026-02-05",
    endDate: "2026-03-05",
    bannerColor: "from-violet-500 to-fuchsia-600",
    bannerImage: "/images/contests/web3-onboarding-flow.png",
    hot: false,
    preTge: false,
  },
  {
    id: "defi-risk-analysis",
    title: "DeFi Risk Analysis Framework",
    description: "Build a comprehensive risk assessment framework for DeFi protocols. Include quantitative models, scoring systems, and case studies.",
    organizer: { name: "Gauntlet", logo: "G", verified: true },
    category: "research",
    phase: "disputes",
    prizePool: "500K USDC",
    prizeAmount: 500000,
    currency: "USDC",
    winnersCount: 10,
    submissionsCount: 67,
    maxSubmissions: 100,
    daysRemaining: 1,
    startDate: "2026-01-25",
    endDate: "2026-02-15",
    bannerColor: "from-emerald-500 to-teal-600",
    hot: false,
    preTge: false,
  },
  {
    id: "zero-knowledge-tutorial",
    title: "Zero Knowledge Proofs 101",
    description: "Write the definitive beginner guide to ZK proofs. Cover SNARKs, STARKs, and practical applications in crypto.",
    organizer: { name: "zkSync", logo: "ZK", verified: true },
    category: "content",
    phase: "submission",
    prizePool: "400K USDC",
    prizeAmount: 400000,
    currency: "USDC",
    winnersCount: 40,
    submissionsCount: 198,
    maxSubmissions: 500,
    daysRemaining: 12,
    startDate: "2026-02-03",
    endDate: "2026-03-03",
    bannerColor: "from-indigo-500 to-violet-600",
    hot: false,
    preTge: true,
  },
];

export const PHASE_LABELS: Record<ContestPhase, string> = {
  submission: "Submissions Open",
  scoring: "Scoring",
  disputes: "Disputes",
  voting: "Community Voting",
  judging: "Expert Judging",
  finalization: "Finalizing",
  completed: "Completed",
};

export const CATEGORY_LABELS: Record<ContestCategory, string> = {
  content: "Content",
  design: "Design",
  dev: "Development",
  research: "Research",
  other: "Other",
};

/** User's submission to a contest (mock for "My submissions" list) */
export type SubmissionStatus = "pending" | "scored" | "won" | "withdrawn";

export interface MySubmission {
  id: string;
  contestId: string;
  title: string;
  workUrl: string;
  description: string;
  status: SubmissionStatus;
  rank?: number;
  submittedAt: string;
}

export const MOCK_MY_SUBMISSIONS: MySubmission[] = [
  {
    id: "sub-1",
    contestId: "best-defi-tutorial",
    title: "Complete Guide to Yield Farming",
    workUrl: "https://example.com/defi-guide",
    description: "A step-by-step tutorial covering liquidity pools, APY, and risk management for beginners.",
    status: "pending",
    submittedAt: "2026-02-01",
  },
  {
    id: "sub-2",
    contestId: "smart-contract-audit",
    title: "Audit Report: Core Module",
    workUrl: "https://example.com/audit-report",
    description: "Security audit findings for the core contract module with severity ratings and recommendations.",
    status: "pending",
    submittedAt: "2026-02-05",
  },
  {
    id: "sub-3",
    contestId: "layer2-explainer",
    title: "Layer 2 Explained in 5 Minutes",
    workUrl: "https://example.com/l2-video",
    description: "Short video explainer on rollups and how L2 scaling works for a general audience.",
    status: "won",
    rank: 12,
    submittedAt: "2025-12-15",
  },
];

/** Find a submission by id; optionally require contestId to match (for URL validation). */
export function getSubmissionById(
  submissionId: string,
  contestId?: string
): MySubmission | undefined {
  const sub = MOCK_MY_SUBMISSIONS.find((s) => s.id === submissionId);
  if (!sub) return undefined;
  if (contestId != null && sub.contestId !== contestId) return undefined;
  return sub;
}

/** Public contest entry (for voting list, leaderboard). */
export interface ContestEntry {
  id: string;
  contestId: string;
  title: string;
  description: string;
  workUrl: string;
  author: string;
}

export const MOCK_CONTEST_ENTRIES: ContestEntry[] = [
  {
    id: "e-best-defi-1",
    contestId: "best-defi-tutorial",
    title: "Complete Guide to Yield Farming",
    description: "A step-by-step tutorial covering liquidity pools, APY, and risk management.",
    workUrl: "https://example.com/defi-guide",
    author: "0x1234...abcd",
  },
  {
    id: "e-best-defi-2",
    contestId: "best-defi-tutorial",
    title: "DeFi for Beginners: From Zero to Liquidity",
    description: "Understand AMMs, impermanent loss, and how to evaluate pools.",
    workUrl: "https://example.com/defi-beginners",
    author: "alice.eth",
  },
  {
    id: "e-best-defi-3",
    contestId: "best-defi-tutorial",
    title: "Lending Protocols Explained",
    description: "How compound interest and collateralization work in DeFi lending.",
    workUrl: "https://example.com/lending",
    author: "0x5678...ef01",
  },
  {
    id: "e-best-defi-4",
    contestId: "best-defi-tutorial",
    title: "Yield Aggregators: Maximizing Returns",
    description: "Strategies and risks of yield aggregators and vaults.",
    workUrl: "https://example.com/aggregators",
    author: "bob.eth",
  },
  {
    id: "e-best-defi-5",
    contestId: "best-defi-tutorial",
    title: "Understanding Liquidity Pools",
    description: "Deep dive into x*y=k, price impact, and pool composition.",
    workUrl: "https://example.com/liquidity-pools",
    author: "0x9abc...2345",
  },
  {
    id: "e-ai-art-1",
    contestId: "ai-art-competition",
    title: "Abstract Neural Landscapes",
    description: "AI-generated series exploring depth and color.",
    workUrl: "https://example.com/ai-art-1",
    author: "creator.eth",
  },
  {
    id: "e-ai-art-2",
    contestId: "ai-art-competition",
    title: "Portrait in Motion",
    description: "Animated portrait using stable diffusion.",
    workUrl: "https://example.com/ai-art-2",
    author: "0xabcd...",
  },
  {
    id: "e-ai-art-3",
    contestId: "ai-art-competition",
    title: "Crypto Punk Revival",
    description: "Reimagined punks with modern AI style.",
    workUrl: "https://example.com/ai-art-3",
    author: "artist.eth",
  },
  {
    id: "e-defi-risk-1",
    contestId: "defi-risk-analysis",
    title: "Quantitative Risk Framework for Lending Protocols",
    description: "A scoring model for collateral and liquidity risk.",
    workUrl: "https://example.com/defi-risk-1",
    author: "researcher.eth",
  },
];

export function getEntriesByContestId(contestId: string): ContestEntry[] {
  return MOCK_CONTEST_ENTRIES.filter((e) => e.contestId === contestId);
}

/** Mock: number of entries the current user (as judge) has scored per contest. */
export const MOCK_JUDGE_PROGRESS: Record<string, number> = {
  "ai-art-competition": 2,
};
