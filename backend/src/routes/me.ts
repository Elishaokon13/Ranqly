import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { RequestWithAuth, requireAuth } from "../middleware/auth";

const router = Router();

/** GET /api/me/submissions — current user's submissions across all contests */
router.get("/submissions", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const submissions = await prisma.submission.findMany({
    where: { authorId: req.userId! },
    include: { contest: { select: { id: true, slug: true, title: true, phase: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items: submissions });
});

export default router;
