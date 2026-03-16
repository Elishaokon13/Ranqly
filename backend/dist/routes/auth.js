"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRY = "7d";
const router = (0, express_1.Router)();
/** POST /api/auth/nonce — get SIWE nonce (placeholder: returns fixed nonce for dev) */
router.post("/nonce", async (_req, res) => {
    res.json({ nonce: `ranqly-${Date.now()}` });
});
const siweBody = zod_1.z.object({
    message: zod_1.z.string(),
    signature: zod_1.z.string(),
});
/** POST /api/auth/siwe — verify SIWE and issue JWT (placeholder: accepts wallet + signature, creates/finds user, returns token) */
router.post("/siwe", async (req, res) => {
    const parsed = siweBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
        return;
    }
    // TODO: verify SIWE message + signature, extract address
    // For now: require walletAddress in body for dev
    const walletAddress = req.body.walletAddress?.toLowerCase();
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        res.status(400).json({ error: "walletAddress required (0x...)" });
        return;
    }
    let user = await prisma_1.prisma.user.findUnique({ where: { walletAddress } });
    if (!user) {
        user = await prisma_1.prisma.user.create({
            data: { walletAddress },
        });
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, walletAddress: user.walletAddress ?? undefined }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({
        token,
        user: {
            id: user.id,
            walletAddress: user.walletAddress,
            email: user.email,
            path: user.path,
            name: user.name,
        },
    });
});
/** GET /api/auth/me — current user (requires auth) */
router.get("/me", auth_1.requireAuth, async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, walletAddress: true, email: true, path: true, name: true, avatarUrl: true, organizerVerified: true },
    });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json(user);
});
exports.default = router;
