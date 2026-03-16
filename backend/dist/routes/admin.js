"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// TODO: add isAdmin to User and check here
function requireAdmin(req, res, next) {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    next();
}
/** GET /api/admin/overview — counts for admin dashboard */
router.get("/overview", auth_1.requireAuth, requireAdmin, async (_req, res) => {
    const [contestsCount, disputesCount, usersCount] = await Promise.all([
        prisma_1.prisma.contest.count(),
        prisma_1.prisma.dispute.count({ where: { status: { not: "resolved" } } }),
        prisma_1.prisma.user.count(),
    ]);
    res.json({ contestsCount, disputesCount, usersCount });
});
/** GET /api/admin/contests — list all contests (admin) */
router.get("/contests", auth_1.requireAuth, requireAdmin, async (_req, res) => {
    const contests = await prisma_1.prisma.contest.findMany({
        include: { organizer: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
    res.json({ items: contests.map((c) => ({ ...c, prizeAmount: c.prizeAmount.toString() })) });
});
/** GET /api/admin/disputes — list all disputes (admin) */
router.get("/disputes", auth_1.requireAuth, requireAdmin, async (_req, res) => {
    const disputes = await prisma_1.prisma.dispute.findMany({
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
exports.default = router;
