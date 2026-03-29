"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disputeCreateRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const contestLookup_1 = require("../lib/contestLookup");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const disputeTypeEnum = zod_1.z.enum(["plagiarism", "rule_violation", "other"]);
const disputeStatusEnum = zod_1.z.enum(["open", "under_review", "resolved"]);
/** GET /api/disputes — list disputes (query: contestId, status) */
router.get("/", auth_1.optionalAuth, async (req, res) => {
    const contestId = req.query.contestId;
    const status = req.query.status;
    const where = {};
    if (contestId)
        where.contestId = contestId;
    if (status && disputeStatusEnum.safeParse(status).success)
        where.status = status;
    const disputes = await prisma_1.prisma.dispute.findMany({
        where,
        include: {
            submission: { select: { id: true, title: true } },
            contest: { select: { id: true, slug: true, title: true } },
            filedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    res.json({ items: disputes });
});
const createDisputeBody = zod_1.z.object({
    submissionId: zod_1.z.string(),
    type: disputeTypeEnum,
    summary: zod_1.z.string().min(10).max(2000),
});
exports.disputeCreateRouter = (0, express_1.Router)({ mergeParams: true });
/** POST /api/contests/:contestId/disputes — file a dispute (authenticated user) */
exports.disputeCreateRouter.post("/", auth_1.requireAuth, async (req, res) => {
    const param = req.params.contestId;
    const parsed = createDisputeBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
    }
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    if (contest.phase !== "disputes") {
        res.status(400).json({ error: "Contest is not in disputes phase" });
        return;
    }
    const submission = await prisma_1.prisma.submission.findFirst({
        where: { id: parsed.data.submissionId, contestId: contest.id },
    });
    if (!submission) {
        res.status(404).json({ error: "Submission not found in this contest" });
        return;
    }
    const dispute = await prisma_1.prisma.dispute.create({
        data: {
            contestId: contest.id,
            submissionId: parsed.data.submissionId,
            filedById: req.userId,
            type: parsed.data.type,
            summary: parsed.data.summary,
        },
        include: {
            submission: { select: { id: true, title: true } },
            contest: { select: { id: true, slug: true } },
        },
    });
    res.status(201).json(dispute);
});
const updateDisputeBody = zod_1.z.object({
    status: disputeStatusEnum.optional(),
});
/** PATCH /api/disputes/:id — update dispute status (admin or organizer) */
router.patch("/:id", auth_1.requireAuth, async (req, res) => {
    const parsed = updateDisputeBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
    }
    const dispute = await prisma_1.prisma.dispute.findUnique({
        where: { id: req.params.id },
        include: { contest: true },
    });
    if (!dispute) {
        res.status(404).json({ error: "Dispute not found" });
        return;
    }
    const isOrganizer = dispute.contest.organizerId === req.userId;
    // TODO: admin check (e.g. isAdmin flag on User)
    if (!isOrganizer) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const update = {};
    if (parsed.data.status != null) {
        update.status = parsed.data.status;
        if (parsed.data.status === "resolved")
            update.resolvedAt = new Date();
    }
    const updated = await prisma_1.prisma.dispute.update({
        where: { id: req.params.id },
        data: update,
        include: { submission: { select: { id: true, title: true } }, contest: { select: { id: true, slug: true } } },
    });
    res.json(updated);
});
exports.default = router;
