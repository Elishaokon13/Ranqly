import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { RequestWithAuth, requireAuth } from "../middleware/auth";

const router = Router({ mergeParams: true });

/** GET /api/contests/:contestId/judges — list judge assignments (organizer) */
router.get("/", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const contestId = req.params.contestId;
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  if (contest.organizerId !== req.userId) {
    res.status(403).json({ error: "Forbidden: not the organizer" });
    return;
  }
  const assignments = await prisma.judgeAssignment.findMany({
    where: { contestId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { invitedAt: "desc" },
  });
  res.json({ items: assignments });
});

const inviteJudgeBody = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
}).refine((d) => d.email ?? d.userId, { message: "email or userId required" });

/** POST /api/contests/:contestId/judges — invite judge by email or userId (organizer) */
router.post("/", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const contestId = req.params.contestId;
  const parsed = inviteJudgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  if (contest.organizerId !== req.userId) {
    res.status(403).json({ error: "Forbidden: not the organizer" });
    return;
  }
  const existingByUser = parsed.data.userId
    ? await prisma.judgeAssignment.findUnique({
        where: { contestId_userId: { contestId, userId: parsed.data.userId } },
      })
    : null;
  const existingByEmail = parsed.data.email
    ? await prisma.judgeAssignment.findFirst({
        where: { contestId, email: parsed.data.email },
      })
    : null;
  if (existingByUser || existingByEmail) {
    res.status(409).json({ error: "Judge already invited" });
    return;
  }
  const assignment = await prisma.judgeAssignment.create({
    data: {
      contestId,
      userId: parsed.data.userId ?? null,
      email: parsed.data.email ?? null,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.status(201).json(assignment);
});

const submitScoresBody = z.object({
  scores: z.array(z.object({
    submissionId: z.string(),
    score: z.number().int().min(0).max(100),
  })).min(1),
});

/** POST /api/contests/:contestId/judge/scores — submit judge scores (assigned judge) */
router.post("/scores", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const contestId = req.params.contestId;
  const parsed = submitScoresBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  const assignment = await prisma.judgeAssignment.findFirst({
    where: { contestId, userId: req.userId!, status: "accepted" },
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
  const submissions = await prisma.submission.findMany({
    where: { id: { in: submissionIds }, contestId },
  });
  if (submissions.length !== new Set(submissionIds).size) {
    res.status(400).json({ error: "All submissionIds must belong to this contest" });
    return;
  }
  await prisma.$transaction(
    parsed.data.scores.map((s) =>
      prisma.judgeScore.upsert({
        where: {
          submissionId_judgeId: { submissionId: s.submissionId, judgeId: req.userId! },
        },
        create: {
          submissionId: s.submissionId,
          judgeId: req.userId!,
          score: s.score,
        },
        update: { score: s.score },
      })
    )
  );
  res.json({ ok: true, count: parsed.data.scores.length });
});

/** GET /api/contests/:contestId/judge/entries — list entries for judging (for judge UI) */
router.get("/entries", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const contestId = req.params.contestId;
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  const assignment = await prisma.judgeAssignment.findFirst({
    where: { contestId, userId: req.userId!, status: "accepted" },
  });
  if (!assignment) {
    res.status(403).json({ error: "Forbidden: not an accepted judge" });
    return;
  }
  const submissions = await prisma.submission.findMany({
    where: { contestId },
    include: { author: { select: { id: true, name: true } } },
  });
  const scores = await prisma.judgeScore.findMany({
    where: { judgeId: req.userId!, submission: { contestId } },
  });
  const scoreBySubmission: Record<string, number> = {};
  scores.forEach((s) => { scoreBySubmission[s.submissionId] = s.score; });
  const items = submissions.map((s) => ({
    ...s,
    myScore: scoreBySubmission[s.id] ?? null,
  }));
  res.json({ items });
});

export default router;
