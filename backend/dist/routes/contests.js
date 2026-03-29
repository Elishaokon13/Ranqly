"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const contestPhaseEnum = zod_1.z.enum([
    "submission", "scoring", "disputes", "voting", "judging", "finalization", "completed",
]);
const contestCategoryEnum = zod_1.z.enum(["content", "design", "dev", "research", "other"]);
/** GET /api/contests — list contests (query: phase, category, limit, offset) */
router.get("/", auth_1.optionalAuth, async (req, res) => {
    const phase = req.query.phase;
    const category = req.query.category;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const where = {};
    if (phase && contestPhaseEnum.safeParse(phase).success)
        where.phase = phase;
    if (category && contestCategoryEnum.safeParse(category).success)
        where.category = category;
    const [contests, total] = await Promise.all([
        prisma_1.prisma.contest.findMany({
            where,
            include: { organizer: { select: { id: true, name: true, organizerVerified: true } } },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        }),
        prisma_1.prisma.contest.count({ where }),
    ]);
    const list = contests.map((c) => ({
        ...c,
        prizeAmount: c.prizeAmount.toString(),
        submissionsCount: undefined,
    }));
    const withCounts = await Promise.all(list.map(async (c) => {
        const submissionsCount = await prisma_1.prisma.submission.count({ where: { contestId: c.id } });
        return { ...c, submissionsCount };
    }));
    res.json({ items: withCounts, total });
});
/** GET /api/contests/:idOrSlug — get one contest by id or slug */
router.get("/:idOrSlug", auth_1.optionalAuth, async (req, res) => {
    const idOrSlug = req.params.idOrSlug;
    const contest = await prisma_1.prisma.contest.findFirst({
        where: idOrSlug.length === 25 ? { id: idOrSlug } : { slug: idOrSlug },
        include: { organizer: { select: { id: true, name: true, avatarUrl: true, organizerVerified: true } } },
    });
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    const submissionsCount = await prisma_1.prisma.submission.count({ where: { contestId: contest.id } });
    res.json({ ...contest, prizeAmount: contest.prizeAmount.toString(), submissionsCount });
});
const createContestBody = zod_1.z.object({
    slug: zod_1.z.string().min(1).max(120),
    title: zod_1.z.string().min(1).max(300),
    description: zod_1.z.string().min(1),
    category: contestCategoryEnum,
    prizePool: zod_1.z.string(),
    prizeAmount: zod_1.z.number().nonnegative(),
    currency: zod_1.z.string().default("USDC"),
    winnersCount: zod_1.z.number().int().positive(),
    maxSubmissions: zod_1.z.number().int().positive().optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    bannerColor: zod_1.z.string().optional(),
    bannerImage: zod_1.z.string().optional(),
    algorithmWeight: zod_1.z.number().min(0).max(1).optional(),
    rules: zod_1.z.string().optional(),
});
/** POST /api/contests — create contest (organizer) */
router.post("/", auth_1.requireAuth, async (req, res) => {
    const parsed = createContestBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
    }
    const data = parsed.data;
    const existing = await prisma_1.prisma.contest.findUnique({ where: { slug: data.slug } });
    if (existing) {
        res.status(409).json({ error: "Contest with this slug already exists" });
        return;
    }
    const contest = await prisma_1.prisma.contest.create({
        data: {
            slug: data.slug,
            title: data.title,
            description: data.description,
            organizerId: req.userId,
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
const updateContestBody = zod_1.z.object({
    phase: contestPhaseEnum.optional(),
    maxSubmissions: zod_1.z.number().int().positive().optional(),
    title: zod_1.z.string().min(1).max(300).optional(),
    description: zod_1.z.string().min(1).optional(),
    rules: zod_1.z.string().optional(),
});
/** PATCH /api/contests/:id — update contest (organizer only) */
router.patch("/:id", auth_1.requireAuth, async (req, res) => {
    const parsed = updateContestBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
    }
    const contest = await prisma_1.prisma.contest.findUnique({ where: { id: req.params.id } });
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    if (contest.organizerId !== req.userId) {
        res.status(403).json({ error: "Forbidden: not the organizer" });
        return;
    }
    const update = {};
    if (parsed.data.phase != null)
        update.phase = parsed.data.phase;
    if (parsed.data.maxSubmissions != null)
        update.maxSubmissions = parsed.data.maxSubmissions;
    if (parsed.data.title != null)
        update.title = parsed.data.title;
    if (parsed.data.description != null)
        update.description = parsed.data.description;
    if (parsed.data.rules != null)
        update.rules = parsed.data.rules;
    const updated = await prisma_1.prisma.contest.update({
        where: { id: req.params.id },
        data: update,
        include: { organizer: { select: { id: true, name: true, organizerVerified: true } } },
    });
    res.json({ ...updated, prizeAmount: updated.prizeAmount.toString() });
});
exports.default = router;
