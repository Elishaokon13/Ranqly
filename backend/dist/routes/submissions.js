"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const contestLookup_1 = require("../lib/contestLookup");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true }); // for :contestId
const createSubmissionBody = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    workUrl: zod_1.z.string().url(),
    description: zod_1.z.string().min(20).max(500),
});
/** GET /api/contests/:contestId/submissions — list submissions (contestId = cuid or slug). Query: limit */
router.get("/", auth_1.optionalAuth, async (req, res) => {
    const param = req.params.contestId;
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 1000);
    const submissions = await prisma_1.prisma.submission.findMany({
        where: { contestId: contest.id },
        include: { author: { select: { id: true, name: true, walletAddress: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
    res.json({ items: submissions });
});
/** POST /api/contests/:contestId/submissions — create submission (creator, contest in submission phase) */
router.post("/", auth_1.requireAuth, async (req, res) => {
    const param = req.params.contestId;
    const parsed = createSubmissionBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
    }
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    if (contest.phase !== "submission") {
        res.status(400).json({ error: "Contest is not in submission phase" });
        return;
    }
    const count = await prisma_1.prisma.submission.count({ where: { contestId: contest.id } });
    if (contest.maxSubmissions != null && count >= contest.maxSubmissions) {
        res.status(400).json({ error: "Max submissions reached" });
        return;
    }
    const submission = await prisma_1.prisma.submission.create({
        data: {
            contestId: contest.id,
            authorId: req.userId,
            title: parsed.data.title,
            workUrl: parsed.data.workUrl,
            description: parsed.data.description,
        },
        include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(submission);
});
/** GET /api/contests/:contestId/submissions/:submissionId — get one submission */
router.get("/:submissionId", auth_1.optionalAuth, async (req, res) => {
    const { contestId: param, submissionId } = req.params;
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    const submission = await prisma_1.prisma.submission.findFirst({
        where: { id: submissionId, contestId: contest.id },
        include: { author: { select: { id: true, name: true, walletAddress: true } }, contest: { select: { id: true, slug: true, title: true, phase: true } } },
    });
    if (!submission) {
        res.status(404).json({ error: "Submission not found" });
        return;
    }
    res.json(submission);
});
exports.default = router;
