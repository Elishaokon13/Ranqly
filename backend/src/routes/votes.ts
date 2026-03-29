import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { findContestByIdOrSlug } from "../lib/contestLookup";
import { RequestWithAuth, requireAuth } from "../middleware/auth";

const router = Router({ mergeParams: true });

const voteItem = z.object({
  submissionId: z.string(),
  direction: z.enum(["up", "down"]),
  justification: z.string().min(10).max(500),
  reasonCode: z.string().min(1).max(10), // U1–U4, D1–D4
});
const submitVotesBody = z.object({
  votes: z.array(voteItem).min(1).max(50),
});

/** POST /api/contests/:contestId/votes — submit votes (voter; contest in voting phase) */
router.post("/", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const param = req.params.contestId;
  const parsed = submitVotesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const contest = await findContestByIdOrSlug(prisma, param);
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  if (contest.phase !== "voting") {
    res.status(400).json({ error: "Contest is not in voting phase" });
    return;
  }
  const voterId = req.userId!;
  const submissionIds = parsed.data.votes.map((v) => v.submissionId);
  const submissions = await prisma.submission.findMany({
    where: { id: { in: submissionIds }, contestId: contest.id },
  });
  if (submissions.length !== new Set(submissionIds).size) {
    res.status(400).json({ error: "All submissionIds must belong to this contest and exist" });
    return;
  }
  await prisma.$transaction(
    parsed.data.votes.map((v) =>
      prisma.vote.upsert({
        where: {
          submissionId_voterId: { submissionId: v.submissionId, voterId },
        },
        create: {
          submissionId: v.submissionId,
          voterId,
          direction: v.direction as "up" | "down",
          justification: v.justification,
          reasonCode: v.reasonCode,
        },
        update: {
          direction: v.direction as "up" | "down",
          justification: v.justification,
          reasonCode: v.reasonCode,
        },
      })
    )
  );
  res.status(201).json({ ok: true, count: parsed.data.votes.length });
});

export default router;
