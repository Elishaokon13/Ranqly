"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const contestLookup_1 = require("../lib/contestLookup");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true });
const voteItem = zod_1.z.object({
    submissionId: zod_1.z.string(),
    direction: zod_1.z.enum(["up", "down"]),
    justification: zod_1.z.string().min(10).max(500),
    reasonCode: zod_1.z.string().min(1).max(10), // U1–U4, D1–D4
});
const submitVotesBody = zod_1.z.object({
    votes: zod_1.z.array(voteItem).min(1).max(50),
});
/** POST /api/contests/:contestId/votes — submit votes (voter; contest in voting phase) */
router.post("/", auth_1.requireAuth, async (req, res) => {
    const param = req.params.contestId;
    const parsed = submitVotesBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
        return;
    }
    const contest = await (0, contestLookup_1.findContestByIdOrSlug)(prisma_1.prisma, param);
    if (!contest) {
        res.status(404).json({ error: "Contest not found" });
        return;
    }
    if (contest.phase !== "voting") {
        res.status(400).json({ error: "Contest is not in voting phase" });
        return;
    }
    const voterId = req.userId;
    const submissionIds = parsed.data.votes.map((v) => v.submissionId);
    const submissions = await prisma_1.prisma.submission.findMany({
        where: { id: { in: submissionIds }, contestId: contest.id },
    });
    if (submissions.length !== new Set(submissionIds).size) {
        res.status(400).json({ error: "All submissionIds must belong to this contest and exist" });
        return;
    }
    await prisma_1.prisma.$transaction(parsed.data.votes.map((v) => prisma_1.prisma.vote.upsert({
        where: {
            submissionId_voterId: { submissionId: v.submissionId, voterId },
        },
        create: {
            submissionId: v.submissionId,
            voterId,
            direction: v.direction,
            justification: v.justification,
            reasonCode: v.reasonCode,
        },
        update: {
            direction: v.direction,
            justification: v.justification,
            reasonCode: v.reasonCode,
        },
    })));
    res.status(201).json({ ok: true, count: parsed.data.votes.length });
});
exports.default = router;
