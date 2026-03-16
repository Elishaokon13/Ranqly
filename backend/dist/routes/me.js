"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/** GET /api/me/submissions — current user's submissions across all contests */
router.get("/submissions", auth_1.requireAuth, async (req, res) => {
    const submissions = await prisma_1.prisma.submission.findMany({
        where: { authorId: req.userId },
        include: { contest: { select: { id: true, slug: true, title: true, phase: true } } },
        orderBy: { createdAt: "desc" },
    });
    res.json({ items: submissions });
});
exports.default = router;
