"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const siwe_1 = require("siwe");
const ethers_1 = require("ethers");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRY = "7d";
const router = (0, express_1.Router)();
/** GET /api/auth/nonce — get SIWE nonce (for Reown AppKit / SIWE flow) */
router.get("/nonce", async (_req, res) => {
    res.json({ nonce: `ranqly${Date.now()}${Math.random().toString(36).slice(2, 12)}` });
});
/** POST /api/auth/nonce — get SIWE nonce (legacy) */
router.post("/nonce", async (_req, res) => {
    res.json({ nonce: `ranqly${Date.now()}${Math.random().toString(36).slice(2, 12)}` });
});
const siweBody = zod_1.z.object({
    message: zod_1.z.string(),
    signature: zod_1.z.string(),
});
/** Ensure signature is 0x-prefixed hex (siwe.verify expects this). */
function normalizeSignature(sig) {
    const s = (sig ?? "").trim();
    if (/^0x[0-9a-fA-F]+$/.test(s))
        return s;
    if (/^[0-9a-fA-F]+$/.test(s))
        return `0x${s}`;
    return s;
}
/** POST /api/auth/siwe — verify SIWE message + signature, create/find user, issue JWT */
router.post("/siwe", async (req, res) => {
    const parsed = siweBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
        return;
    }
    let { message, signature } = parsed.data;
    message = (message ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const normalizedSignature = normalizeSignature(signature);
    let walletAddress;
    let chainId;
    try {
        const siweMessage = new siwe_1.SiweMessage(message);
        const result = await siweMessage.verify({ signature: normalizedSignature }, { suppressExceptions: true });
        if (!result.success) {
            const err = result.error;
            const addr = (siweMessage.address ?? "").toLowerCase();
            if (addr && /^0x[a-f0-9]{40}$/.test(addr)) {
                try {
                    const recovered = (0, ethers_1.verifyMessage)(message, normalizedSignature);
                    const valid = recovered?.toLowerCase() === addr;
                    if (valid) {
                        walletAddress = addr;
                        chainId = siweMessage.chainId;
                    }
                    else {
                        res.status(401).json({ error: "Invalid signature", details: err?.type ?? "VERIFY_FAILED" });
                        return;
                    }
                }
                catch (_) {
                    res.status(401).json({ error: "Invalid signature", details: err?.type ?? "VERIFY_FAILED" });
                    return;
                }
            }
            else {
                res.status(401).json({ error: "Invalid signature", details: err?.type ?? "VERIFY_FAILED" });
                return;
            }
        }
        else {
            walletAddress = (result.data.address ?? "").toLowerCase();
            chainId = result.data.chainId;
        }
    }
    catch (err) {
        console.error("[SIWE] parse/verify error (e.g. social/embedded):", err);
        const addressMatch = message.match(/\n(0x[a-fA-F0-9]{40})\n/);
        if (addressMatch) {
            const addr = addressMatch[1].toLowerCase();
            try {
                const recovered = (0, ethers_1.verifyMessage)(message, normalizedSignature);
                const valid = recovered?.toLowerCase() === addr;
                if (valid) {
                    walletAddress = addr;
                    chainId = 1;
                }
                else {
                    res.status(401).json({ error: "Invalid signature", details: "ETHERS_VERIFY_FAILED" });
                    return;
                }
            }
            catch (verifyErr) {
                console.error("[SIWE] viem verify error:", verifyErr);
                res.status(401).json({ error: "SIWE verification failed", details: String(verifyErr) });
                return;
            }
        }
        else {
            res.status(400).json({ error: "SIWE verification failed", details: String(err) });
            return;
        }
    }
    if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
        res.status(400).json({ error: "Invalid address from message" });
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
        address: walletAddress,
        chainId,
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
