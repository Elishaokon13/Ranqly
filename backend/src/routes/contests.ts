import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { RequestWithAuth, optionalAuth, requireAuth } from "../middleware/auth";

const router = Router();

const contestPhaseEnum = z.enum([
  "submission", "scoring", "disputes", "voting", "judging", "finalization", "completed",
]);
const contestCategoryEnum = z.enum(["content", "design", "dev", "research", "other"]);

/** GET /api/contests — list contests (query: phase, category, limit, offset) */
router.get("/", optionalAuth as any, async (req: RequestWithAuth, res: Response) => {
  const phase = req.query.phase as string | undefined;
  const category = req.query.category as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const where: Record<string, unknown> = {};
  if (phase && contestPhaseEnum.safeParse(phase).success) where.phase = phase;
  if (category && contestCategoryEnum.safeParse(category).success) where.category = category;

  const [contests, total] = await Promise.all([
    prisma.contest.findMany({
      where,
      include: { organizer: { select: { id: true, name: true, organizerVerified: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.contest.count({ where }),
  ]);

  const list = contests.map((c) => ({
    ...c,
    prizeAmount: c.prizeAmount.toString(),
    submissionsCount: undefined,
  }));
  const withCounts = await Promise.all(
    list.map(async (c) => {
      const submissionsCount = await prisma.submission.count({ where: { contestId: c.id } });
      return { ...c, submissionsCount };
    })
  );
  res.json({ items: withCounts, total });
});

/** GET /api/contests/:idOrSlug — get one contest by id or slug */
router.get("/:idOrSlug", optionalAuth as any, async (req: RequestWithAuth, res: Response) => {
  const idOrSlug = req.params.idOrSlug;
  const contest = await prisma.contest.findFirst({
    where: idOrSlug.length === 25 ? { id: idOrSlug } : { slug: idOrSlug },
    include: { organizer: { select: { id: true, name: true, avatarUrl: true, organizerVerified: true } } },
  });
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  const submissionsCount = await prisma.submission.count({ where: { contestId: contest.id } });
  res.json({ ...contest, prizeAmount: contest.prizeAmount.toString(), submissionsCount });
});

const createContestBody = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  category: contestCategoryEnum,
  prizePool: z.string(),
  prizeAmount: z.number().nonnegative(),
  currency: z.string().default("USDC"),
  winnersCount: z.number().int().positive(),
  maxSubmissions: z.number().int().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  bannerColor: z.string().optional(),
  bannerImage: z.string().optional(),
  algorithmWeight: z.number().min(0).max(1).optional(),
  rules: z.string().optional(),
});

/** POST /api/contests — create contest (organizer) */
router.post("/", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const parsed = createContestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const existing = await prisma.contest.findUnique({ where: { slug: data.slug } });
  if (existing) {
    res.status(409).json({ error: "Contest with this slug already exists" });
    return;
  }
  const contest = await prisma.contest.create({
    data: {
      slug: data.slug,
      title: data.title,
      description: data.description,
      organizerId: req.userId!,
      category: data.category,
      prizePool: data.prizePool,
      prizeAmount: data.prizeAmount,
      currency: data.currency,
      winnersCount: data.winnersCount,
      maxSubmissions: data.maxSubmissions ?? null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      bannerColor: data.bannerColor ?? null,
      bannerImage: data.bannerImage ?? null,
      algorithmWeight: data.algorithmWeight ?? null,
      rules: data.rules ?? null,
    },
    include: { organizer: { select: { id: true, name: true, organizerVerified: true } } },
  });
  res.status(201).json({ ...contest, prizeAmount: contest.prizeAmount.toString() });
});

const updateContestBody = z.object({
  phase: contestPhaseEnum.optional(),
  maxSubmissions: z.number().int().positive().optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().min(1).optional(),
  rules: z.string().optional(),
});

/** PATCH /api/contests/:id — update contest (organizer only) */
router.patch("/:id", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const parsed = updateContestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const contest = await prisma.contest.findUnique({ where: { id: req.params.id } });
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  if (contest.organizerId !== req.userId) {
    res.status(403).json({ error: "Forbidden: not the organizer" });
    return;
  }
  const update: Record<string, unknown> = {};
  if (parsed.data.phase != null) update.phase = parsed.data.phase;
  if (parsed.data.maxSubmissions != null) update.maxSubmissions = parsed.data.maxSubmissions;
  if (parsed.data.title != null) update.title = parsed.data.title;
  if (parsed.data.description != null) update.description = parsed.data.description;
  if (parsed.data.rules != null) update.rules = parsed.data.rules;

  const updated = await prisma.contest.update({
    where: { id: req.params.id },
    data: update as any,
    include: { organizer: { select: { id: true, name: true, organizerVerified: true } } },
  });
  res.json({ ...updated, prizeAmount: updated.prizeAmount.toString() });
});

export default router;
