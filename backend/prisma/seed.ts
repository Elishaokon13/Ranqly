/**
 * Seed DB with Ranqly demo data (formerly frontend mocks). Run: `cd backend && npm run db:seed`
 */
import "dotenv/config";
import { PrismaClient, type ContestPhase, type ContestCategory } from "@prisma/client";

const prisma = new PrismaClient();

type SeedContest = {
  slug: string;
  title: string;
  description: string;
  organizerEmail: string;
  organizerName: string;
  category: ContestCategory;
  phase: ContestPhase;
  prizePool: string;
  prizeAmount: number;
  currency: string;
  winnersCount: number;
  submissionsCount: number;
  maxSubmissions: number;
  startDate: string;
  endDate: string;
  bannerColor: string;
  bannerImage?: string;
  hot: boolean;
  preTge: boolean;
};

const SEED_CONTESTS: SeedContest[] = [
  {
    slug: "best-defi-tutorial",
    title: "Best DeFi Tutorial",
    description:
      "Create the most comprehensive and beginner-friendly DeFi tutorial. Explain yield farming, liquidity pools, or lending protocols.",
    organizerEmail: "seed-org-aave@ranqly.local",
    organizerName: "Aave",
    category: "content",
    phase: "voting",
    prizePool: "2M USDC",
    prizeAmount: 2_000_000,
    currency: "USDC",
    winnersCount: 100,
    submissionsCount: 847,
    maxSubmissions: 1000,
    startDate: "2026-01-15",
    endDate: "2026-02-22",
    bannerColor: "from-primary-500 to-primary-700",
    hot: true,
    preTge: false,
  },
  {
    slug: "ai-art-competition",
    title: "AI Art Competition",
    description:
      "Showcase your best AI-generated artwork. Any style, any tool. Winners selected by community vote and expert judges.",
    organizerEmail: "seed-org-midjourney@ranqly.local",
    organizerName: "Midjourney",
    category: "design",
    phase: "judging",
    prizePool: "500K USDC",
    prizeAmount: 500_000,
    currency: "USDC",
    winnersCount: 50,
    submissionsCount: 1234,
    maxSubmissions: 2000,
    startDate: "2026-01-20",
    endDate: "2026-02-18",
    bannerColor: "from-accent-500 to-accent-700",
    hot: true,
    preTge: false,
  },
  {
    slug: "smart-contract-audit",
    title: "Smart Contract Security Audit",
    description:
      "Find bugs and vulnerabilities in our latest smart contracts. Top auditors earn bounties based on severity of findings.",
    organizerEmail: "seed-org-chainlink@ranqly.local",
    organizerName: "Chainlink",
    category: "dev",
    phase: "submission",
    prizePool: "1M USDC",
    prizeAmount: 1_000_000,
    currency: "USDC",
    winnersCount: 25,
    submissionsCount: 156,
    maxSubmissions: 500,
    startDate: "2026-02-01",
    endDate: "2026-03-01",
    bannerColor: "from-blue-500 to-blue-700",
    bannerImage: "/images/contests/smart-contract-audit.png",
    hot: false,
    preTge: false,
  },
  {
    slug: "dao-governance-research",
    title: "DAO Governance Research",
    description:
      "Submit original research on DAO governance mechanisms. We're looking for novel voting systems, delegation patterns, and treasury management.",
    organizerEmail: "seed-org-aragon@ranqly.local",
    organizerName: "Aragon",
    category: "research",
    phase: "submission",
    prizePool: "250K USDC",
    prizeAmount: 250_000,
    currency: "USDC",
    winnersCount: 20,
    submissionsCount: 45,
    maxSubmissions: 200,
    startDate: "2026-02-10",
    endDate: "2026-03-10",
    bannerColor: "from-purple-500 to-purple-700",
    bannerImage: "/images/contests/dao-governance-research.png",
    hot: false,
    preTge: true,
  },
  {
    slug: "nft-marketplace-design",
    title: "NFT Marketplace UI Design",
    description:
      "Design a next-gen NFT marketplace interface. Focus on discoverability, creator tools, and collector experience.",
    organizerEmail: "seed-org-opensea@ranqly.local",
    organizerName: "OpenSea",
    category: "design",
    phase: "scoring",
    prizePool: "750K USDC",
    prizeAmount: 750_000,
    currency: "USDC",
    winnersCount: 30,
    submissionsCount: 312,
    maxSubmissions: 500,
    startDate: "2026-01-10",
    endDate: "2026-02-10",
    bannerColor: "from-sky-500 to-indigo-600",
    hot: false,
    preTge: false,
  },
  {
    slug: "layer2-explainer",
    title: "Layer 2 Scaling Explainer",
    description:
      "Create clear, visual content explaining Layer 2 scaling solutions. Rollups, sidechains, state channels — make it accessible.",
    organizerEmail: "seed-org-optimism@ranqly.local",
    organizerName: "Optimism",
    category: "content",
    phase: "completed",
    prizePool: "100K USDC",
    prizeAmount: 100_000,
    currency: "USDC",
    winnersCount: 50,
    submissionsCount: 423,
    maxSubmissions: 500,
    startDate: "2025-12-01",
    endDate: "2026-01-15",
    bannerColor: "from-red-500 to-red-700",
    hot: false,
    preTge: false,
  },
  {
    slug: "web3-onboarding-flow",
    title: "Web3 Onboarding UX",
    description:
      "Design the best onboarding experience for Web3 newcomers. Simplify wallet creation, token swaps, and dApp interactions.",
    organizerEmail: "seed-org-rainbow@ranqly.local",
    organizerName: "Rainbow",
    category: "design",
    phase: "submission",
    prizePool: "300K USDC",
    prizeAmount: 300_000,
    currency: "USDC",
    winnersCount: 15,
    submissionsCount: 89,
    maxSubmissions: 300,
    startDate: "2026-02-05",
    endDate: "2026-03-05",
    bannerColor: "from-violet-500 to-fuchsia-600",
    bannerImage: "/images/contests/web3-onboarding-flow.png",
    hot: false,
    preTge: false,
  },
  {
    slug: "defi-risk-analysis",
    title: "DeFi Risk Analysis Framework",
    description:
      "Build a comprehensive risk assessment framework for DeFi protocols. Include quantitative models, scoring systems, and case studies.",
    organizerEmail: "seed-org-gauntlet@ranqly.local",
    organizerName: "Gauntlet",
    category: "research",
    phase: "disputes",
    prizePool: "500K USDC",
    prizeAmount: 500_000,
    currency: "USDC",
    winnersCount: 10,
    submissionsCount: 67,
    maxSubmissions: 100,
    startDate: "2026-01-25",
    endDate: "2026-02-15",
    bannerColor: "from-emerald-500 to-teal-600",
    hot: false,
    preTge: false,
  },
  {
    slug: "zero-knowledge-tutorial",
    title: "Zero Knowledge Proofs 101",
    description:
      "Write the definitive beginner guide to ZK proofs. Cover SNARKs, STARKs, and practical applications in crypto.",
    organizerEmail: "seed-org-zksync@ranqly.local",
    organizerName: "zkSync",
    category: "content",
    phase: "submission",
    prizePool: "400K USDC",
    prizeAmount: 400_000,
    currency: "USDC",
    winnersCount: 40,
    submissionsCount: 198,
    maxSubmissions: 500,
    startDate: "2026-02-03",
    endDate: "2026-03-03",
    bannerColor: "from-indigo-500 to-violet-600",
    hot: false,
    preTge: true,
  },
];

const SLUGS = SEED_CONTESTS.map((c) => c.slug);
/** One fewer bulk row so named demo rows keep total submission counts aligned. */
const DEMO_NAMED_SLUGS = new Set(["best-defi-tutorial", "smart-contract-audit", "layer2-explainer"]);

async function main() {
  console.log("Removing existing seed contests (by slug)…");
  await prisma.contest.deleteMany({ where: { slug: { in: SLUGS } } });

  console.log("Upserting users…");
  const participant = await prisma.user.upsert({
    where: { email: "seed-participant@ranqly.local" },
    create: { email: "seed-participant@ranqly.local", name: "Seed Participant" },
    update: { name: "Seed Participant" },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "seed-demo@ranqly.local" },
    create: { email: "seed-demo@ranqly.local", name: "Demo Creator" },
    update: { name: "Demo Creator" },
  });

  const judgeUser = await prisma.user.upsert({
    where: { email: "seed-judge@ranqly.local" },
    create: { email: "seed-judge@ranqly.local", name: "Seed Judge" },
    update: { name: "Seed Judge" },
  });

  for (const row of SEED_CONTESTS) {
    await prisma.user.upsert({
      where: { email: row.organizerEmail },
      create: {
        email: row.organizerEmail,
        name: row.organizerName,
        organizerVerified: true,
      },
      update: {
        name: row.organizerName,
        organizerVerified: true,
      },
    });
  }

  let totalSubs = 0;
  for (const row of SEED_CONTESTS) {
    const organizer = await prisma.user.findUniqueOrThrow({
      where: { email: row.organizerEmail },
      select: { id: true },
    });

    const contest = await prisma.contest.create({
      data: {
        slug: row.slug,
        title: row.title,
        description: row.description,
        organizerId: organizer.id,
        category: row.category,
        phase: row.phase,
        prizePool: row.prizePool,
        prizeAmount: row.prizeAmount,
        currency: row.currency,
        winnersCount: row.winnersCount,
        maxSubmissions: row.maxSubmissions,
        startDate: new Date(`${row.startDate}T12:00:00.000Z`),
        endDate: new Date(`${row.endDate}T12:00:00.000Z`),
        bannerColor: row.bannerColor,
        bannerImage: row.bannerImage ?? null,
        hot: row.hot,
        preTge: row.preTge,
      },
    });

    const n = DEMO_NAMED_SLUGS.has(row.slug) ? row.submissionsCount - 1 : row.submissionsCount;
    const chunkSize = 500;
    for (let offset = 0; offset < n; offset += chunkSize) {
      const take = Math.min(chunkSize, n - offset);
      await prisma.submission.createMany({
        data: Array.from({ length: take }, (_, i) => ({
          contestId: contest.id,
          authorId: participant.id,
          title: `Demo submission ${offset + i + 1}`,
          workUrl: `https://example.com/demo/${row.slug}/${offset + i + 1}`,
          description: "Seeded placeholder entry (matches former mock totals).",
        })),
      });
    }
    totalSubs += n;
    console.log(`  ${row.slug}: ${n} bulk submissions`);
  }

  // Named submissions for seed-demo@ranqly.local (former MOCK_MY_SUBMISSIONS)
  const cBest = await prisma.contest.findUniqueOrThrow({ where: { slug: "best-defi-tutorial" } });
  const cAudit = await prisma.contest.findUniqueOrThrow({ where: { slug: "smart-contract-audit" } });
  const cL2 = await prisma.contest.findUniqueOrThrow({ where: { slug: "layer2-explainer" } });

  await prisma.submission.create({
    data: {
      contestId: cBest.id,
      authorId: demoUser.id,
      title: "Complete Guide to Yield Farming",
      workUrl: "https://example.com/defi-guide",
      description:
        "A step-by-step tutorial covering liquidity pools, APY, and risk management for beginners.",
      status: "pending",
    },
  });
  await prisma.submission.create({
    data: {
      contestId: cAudit.id,
      authorId: demoUser.id,
      title: "Audit Report: Core Module",
      workUrl: "https://example.com/audit-report",
      description:
        "Security audit findings for the core contract module with severity ratings and recommendations.",
      status: "pending",
    },
  });
  await prisma.submission.create({
    data: {
      contestId: cL2.id,
      authorId: demoUser.id,
      title: "Layer 2 Explained in 5 Minutes",
      workUrl: "https://example.com/l2-video",
      description: "Short video explainer on rollups and how L2 scaling works for a general audience.",
      status: "won",
      rank: 12,
    },
  });
  totalSubs += 3;
  console.log("  seed-demo@ranqly.local: 3 named submissions");

  // Judge assignment + scores (former MOCK_JUDGE_PROGRESS)
  const aiArt = await prisma.contest.findUniqueOrThrow({ where: { slug: "ai-art-competition" } });
  await prisma.judgeAssignment.create({
    data: {
      contestId: aiArt.id,
      userId: judgeUser.id,
      status: "accepted",
    },
  });
  const aiEntries = await prisma.submission.findMany({
    where: { contestId: aiArt.id },
    orderBy: { createdAt: "asc" },
    take: 2,
  });
  for (const s of aiEntries) {
    await prisma.judgeScore.create({
      data: { submissionId: s.id, judgeId: judgeUser.id, score: 78 },
    });
  }
  console.log("  Judge: seed-judge@ranqly.local → ai-art-competition (2 scores)");

  // Disputes (former disputes page mock)
  const risk = await prisma.contest.findUniqueOrThrow({ where: { slug: "defi-risk-analysis" } });
  const riskSubs = await prisma.submission.findMany({
    where: { contestId: risk.id },
    orderBy: { createdAt: "asc" },
    take: 2,
  });
  if (riskSubs.length >= 2) {
    await prisma.dispute.create({
      data: {
        contestId: risk.id,
        submissionId: riskSubs[0].id,
        filedById: participant.id,
        type: "plagiarism",
        summary: "Suspected similarity with a prior published framework (seed).",
        status: "open",
      },
    });
    await prisma.dispute.create({
      data: {
        contestId: risk.id,
        submissionId: riskSubs[1].id,
        filedById: participant.id,
        type: "rule_violation",
        summary: "Entry may not meet quantitative evidence requirements (seed).",
        status: "under_review",
      },
    });
    console.log("  defi-risk-analysis: 2 disputes");
  }

  console.log(`Done. ${SEED_CONTESTS.length} contests, ${totalSubs} submissions (+ disputes & judge scores).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
