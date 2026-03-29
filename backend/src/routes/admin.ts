import { Router, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { RequestWithAuth, requireAuth } from "../middleware/auth";

const router = Router();

// TODO: add isAdmin to User and check here
function requireAdmin(req: RequestWithAuth, res: Response, next: NextFunction): void {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/** GET /api/admin/overview — counts for admin dashboard */
router.get("/overview", requireAuth as any, requireAdmin as any, async (_req: RequestWithAuth, res: Response) => {
  const [contestsCount, disputesCount, usersCount] = await Promise.all([
    prisma.contest.count(),
    prisma.dispute.count({ where: { status: { not: "resolved" } } }),
    prisma.user.count(),
  ]);
  res.json({ contestsCount, disputesCount, usersCount });
});

/** GET /api/admin/contests — list all contests (admin) */
router.get("/contests", requireAuth as any, requireAdmin as any, async (_req: RequestWithAuth, res: Response) => {
  const contests = await prisma.contest.findMany({
    include: { organizer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ items: contests.map((c) => ({ ...c, prizeAmount: c.prizeAmount.toString() })) });
});

/** GET /api/admin/disputes — list all disputes (admin) */
router.get("/disputes", requireAuth as any, requireAdmin as any, async (_req: RequestWithAuth, res: Response) => {
  const disputes = await prisma.dispute.findMany({
    include: {
      submission: { select: { id: true, title: true } },
      contest: { select: { id: true, slug: true, title: true } },
      filedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ items: disputes });
});

export default router;
