import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { findContestByIdOrSlug } from "../lib/contestLookup";
import { RequestWithAuth, optionalAuth, requireAuth } from "../middleware/auth";

const router = Router({ mergeParams: true }); // for :contestId

const createSubmissionBody = z.object({
  title: z.string().min(3).max(200),
  workUrl: z.string().url(),
  description: z.string().min(20).max(500),
});

/** GET /api/contests/:contestId/submissions — list submissions (contestId = cuid or slug). Query: limit */
router.get("/", optionalAuth as any, async (req: RequestWithAuth, res: Response) => {
  const param = req.params.contestId;
  const contest = await findContestByIdOrSlug(prisma, param);
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 1000);
  const submissions = await prisma.submission.findMany({
    where: { contestId: contest.id },
    include: { author: { select: { id: true, name: true, walletAddress: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  res.json({ items: submissions });
});

/** POST /api/contests/:contestId/submissions — create submission (creator, contest in submission phase) */
router.post("/", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const param = req.params.contestId;
  const parsed = createSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const contest = await findContestByIdOrSlug(prisma, param);
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  if (contest.phase !== "submission") {
    res.status(400).json({ error: "Contest is not in submission phase" });
    return;
  }
  const count = await prisma.submission.count({ where: { contestId: contest.id } });
  if (contest.maxSubmissions != null && count >= contest.maxSubmissions) {
    res.status(400).json({ error: "Max submissions reached" });
    return;
  }
  const submission = await prisma.submission.create({
    data: {
      contestId: contest.id,
      authorId: req.userId!,
      title: parsed.data.title,
      workUrl: parsed.data.workUrl,
      description: parsed.data.description,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  res.status(201).json(submission);
});

/** GET /api/contests/:contestId/submissions/:submissionId — get one submission */
router.get("/:submissionId", optionalAuth as any, async (req: RequestWithAuth, res: Response) => {
  const { contestId: param, submissionId } = req.params;
  const contest = await findContestByIdOrSlug(prisma, param);
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, contestId: contest.id },
    include: { author: { select: { id: true, name: true, walletAddress: true } }, contest: { select: { id: true, slug: true, title: true, phase: true } } },
  });
  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  res.json(submission);
});

export default router;
