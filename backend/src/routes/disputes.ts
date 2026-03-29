import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { findContestByIdOrSlug } from "../lib/contestLookup";
import { RequestWithAuth, optionalAuth, requireAuth } from "../middleware/auth";

const router = Router();

const disputeTypeEnum = z.enum(["plagiarism", "rule_violation", "other"]);
const disputeStatusEnum = z.enum(["open", "under_review", "resolved"]);

/** GET /api/disputes — list disputes (query: contestId, status) */
router.get("/", optionalAuth as any, async (req: RequestWithAuth, res: Response) => {
  const contestId = req.query.contestId as string | undefined;
  const status = req.query.status as string | undefined;
  const where: Record<string, unknown> = {};
  if (contestId) where.contestId = contestId;
  if (status && disputeStatusEnum.safeParse(status).success) where.status = status;

  const disputes = await prisma.dispute.findMany({
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

const createDisputeBody = z.object({
  submissionId: z.string(),
  type: disputeTypeEnum,
  summary: z.string().min(10).max(2000),
});

export const disputeCreateRouter = Router({ mergeParams: true });

/** POST /api/contests/:contestId/disputes — file a dispute (authenticated user) */
disputeCreateRouter.post("/", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const param = req.params.contestId as string;
  const parsed = createDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const contest = await findContestByIdOrSlug(prisma, param);
  if (!contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  if (contest.phase !== "disputes") {
    res.status(400).json({ error: "Contest is not in disputes phase" });
    return;
  }
  const submission = await prisma.submission.findFirst({
    where: { id: parsed.data.submissionId, contestId: contest.id },
  });
  if (!submission) {
    res.status(404).json({ error: "Submission not found in this contest" });
    return;
  }
  const dispute = await prisma.dispute.create({
    data: {
      contestId: contest.id,
      submissionId: parsed.data.submissionId,
      filedById: req.userId!,
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

const updateDisputeBody = z.object({
  status: disputeStatusEnum.optional(),
});

/** PATCH /api/disputes/:id — update dispute status (admin or organizer) */
router.patch("/:id", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const parsed = updateDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const dispute = await prisma.dispute.findUnique({
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
  const update: Record<string, unknown> = {};
  if (parsed.data.status != null) {
    update.status = parsed.data.status;
    if (parsed.data.status === "resolved") update.resolvedAt = new Date();
  }
  const updated = await prisma.dispute.update({
    where: { id: req.params.id },
    data: update as any,
    include: { submission: { select: { id: true, title: true } }, contest: { select: { id: true, slug: true } } },
  });
  res.json(updated);
});

export default router;
