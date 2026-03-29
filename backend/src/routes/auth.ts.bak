import { Router, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { SiweMessage } from "siwe";
import { prisma } from "../lib/prisma";
import { RequestWithAuth, requireAuth } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRY = "7d";

const router = Router();

/** GET /api/auth/nonce — get SIWE nonce (for Reown AppKit / SIWE flow) */
router.get("/nonce", async (_req, res: Response) => {
  res.json({ nonce: `ranqly${Date.now()}${Math.random().toString(36).slice(2, 12)}` });
});

/** POST /api/auth/nonce — get SIWE nonce (legacy) */
router.post("/nonce", async (_req, res: Response) => {
  res.json({ nonce: `ranqly${Date.now()}${Math.random().toString(36).slice(2, 12)}` });
});

const siweBody = z.object({
  message: z.string(),
  signature: z.string(),
});

/** Ensure signature is 0x-prefixed hex (siwe.verify expects this). */
function normalizeSignature(sig: string): string {
  const s = (sig ?? "").trim();
  if (/^0x[0-9a-fA-F]+$/.test(s)) return s;
  if (/^[0-9a-fA-F]+$/.test(s)) return `0x${s}`;
  return s;
}

/** POST /api/auth/siwe — verify SIWE message + signature, create/find user, issue JWT */
router.post("/siwe", async (req, res: Response) => {
  const parsed = siweBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  let { message, signature } = parsed.data;
  message = (message ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const normalizedSignature = normalizeSignature(signature);
  let walletAddress: string;
  let chainId: number | undefined;
  try {
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify(
      { signature: normalizedSignature },
      { suppressExceptions: true }
    );
    if (!result.success) {
      const err = result.error as { type?: string; expected?: string; received?: string } | undefined;
      res.status(401).json({
        error: "Invalid signature",
        details: err?.type ?? "VERIFY_FAILED",
        expected: err?.expected,
        received: err?.received,
      });
      return;
    }
    walletAddress = (result.data.address ?? "").toLowerCase();
    chainId = result.data.chainId;
  } catch (err) {
    console.error("[SIWE] parse/verify error:", err);
    res.status(400).json({ error: "SIWE verification failed", details: String(err) });
    return;
  }
  if (!walletAddress || !/^0x[a-f0-9]{40}$/.test(walletAddress)) {
    res.status(400).json({ error: "Invalid address from message" });
    return;
  }
  let user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) {
    user = await prisma.user.create({
      data: { walletAddress },
    });
  }
  const token = jwt.sign(
    { userId: user.id, walletAddress: user.walletAddress ?? undefined },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
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
router.get("/me", requireAuth, async (req: RequestWithAuth, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, walletAddress: true, email: true, path: true, name: true, avatarUrl: true, organizerVerified: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

export default router;
