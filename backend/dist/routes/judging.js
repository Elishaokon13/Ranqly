"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const contestLookup_1 = require("../lib/contestLookup");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
/** GET /api/contests/:contestId/judges — list judge assignments (organizer) */
router.get("/", auth_1.requireAuth, async (req, res) => {
    const param = req.params.contestId;
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    if (contest.organizerId !== req.userId) {
        res.status(403).json({ error: "Forbidden: not the organizer" });
        return;
    }
    const assignments = await prisma_1.prisma.judgeAssignment.findMany({
        where: { contestId: contest.id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { invitedAt: "desc" },
    });
    res.json({ items: assignments });
});
const inviteJudgeBody = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    userId: zod_1.z.string().optional(),
}).refine((d) => d.email ?? d.userId, { message: "email or userId required" });
/** POST /api/contests/:contestId/judges — invite judge by email or userId (organizer) */
router.post("/", auth_1.requireAuth, async (req, res) => {
    const param = req.params.contestId;
    const parsed = inviteJudgeBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
    }
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    if (contest.organizerId !== req.userId) {
        res.status(403).json({ error: "Forbidden: not the organizer" });
        return;
    }
    const existingByUser = parsed.data.userId
        ? await prisma_1.prisma.judgeAssignment.findUnique({
            where: { contestId_userId: { contestId: contest.id, userId: parsed.data.userId } },
        })
        : null;
    const existingByEmail = parsed.data.email
        ? await prisma_1.prisma.judgeAssignment.findFirst({
            where: { contestId: contest.id, email: parsed.data.email },
        })
        : null;
    if (existingByUser || existingByEmail) {
        res.status(409).json({ error: "Judge already invited" });
        return;
    }
    const assignment = await prisma_1.prisma.judgeAssignment.create({
        data: {
            contestId: contest.id,
            userId: parsed.data.userId ?? null,
            email: parsed.data.email ?? null,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(assignment);
});
const submitScoresBody = zod_1.z.object({
    scores: zod_1.z.array(zod_1.z.object({
        submissionId: zod_1.z.string(),
        score: zod_1.z.number().int().min(0).max(100),
    })).min(1),
});
/** POST /api/contests/:contestId/judge/scores — submit judge scores (assigned judge) */
router.post("/scores", auth_1.requireAuth, async (req, res) => {
    const param = req.params.contestId;
    const parsed = submitScoresBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
    }
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    const assignment = await prisma_1.prisma.judgeAssignment.findFirst({
        where: { contestId: contest.id, userId: req.userId, status: "accepted" },
    });
    if (!assignment) {
        res.status(403).json({ error: "Forbidden: you are not an accepted judge for this contest" });
        return;
    }
    if (contest.phase !== "judging" && contest.phase !== "finalization") {
        res.status(400).json({ error: "Contest is not in judging phase" });
        return;
    }
    const submissionIds = parsed.data.scores.map((s) => s.submissionId);
    const submissions = await prisma_1.prisma.submission.findMany({
        where: { id: { in: submissionIds }, contestId: contest.id },
    });
    if (submissions.length !== new Set(submissionIds).size) {
        res.status(400).json({ error: "All submissionIds must belong to this contest" });
        return;
    }
    await prisma_1.prisma.$transaction(parsed.data.scores.map((s) => prisma_1.prisma.judgeScore.upsert({
        where: {
            submissionId_judgeId: { submissionId: s.submissionId, judgeId: req.userId },
        },
        create: {
            submissionId: s.submissionId,
            judgeId: req.userId,
            score: s.score,
        },
        update: { score: s.score },
    })));
    res.json({ ok: true, count: parsed.data.scores.length });
});
/** GET /api/contests/:contestId/judge/entries — list entries for judging (for judge UI) */
router.get("/entries", auth_1.requireAuth, async (req, res) => {
    const param = req.params.contestId;
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    const assignment = await prisma_1.prisma.judgeAssignment.findFirst({
        where: { contestId: contest.id, userId: req.userId, status: "accepted" },
    });
    if (!assignment) {
        res.status(403).json({ error: "Forbidden: not an accepted judge" });
        return;
    }
    const submissions = await prisma_1.prisma.submission.findMany({
        where: { contestId: contest.id },
        include: { author: { select: { id: true, name: true } } },
    });
    const scores = await prisma_1.prisma.judgeScore.findMany({
        where: { judgeId: req.userId, submission: { contestId: contest.id } },
    });
    const scoreBySubmission = {};
    scores.forEach((s) => { scoreBySubmission[s.submissionId] = s.score; });
    const items = submissions.map((s) => ({
        ...s,
        myScore: scoreBySubmission[s.id] ?? null,
    }));
    res.json({ items });
});
exports.default = router;
