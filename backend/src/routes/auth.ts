import { Router, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { RequestWithAuth, requireAuth } from "../middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRY = "7d";

const router = Router();

/** POST /api/auth/nonce — get SIWE nonce (placeholder: returns fixed nonce for dev) */
router.post("/nonce", async (_req, res: Response) => {
  res.json({ nonce: `ranqly-${Date.now()}` });
});

const siweBody = z.object({
  message: z.string(),
  signature: z.string(),
});
/** POST /api/auth/siwe — verify SIWE and issue JWT (placeholder: accepts wallet + signature, creates/finds user, returns token) */
router.post("/siwe", async (req, res: Response) => {
  const parsed = siweBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  // TODO: verify SIWE message + signature, extract address
  // For now: require walletAddress in body for dev
  const walletAddress = (req.body.walletAddress as string)?.toLowerCase();
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    res.status(400).json({ error: "walletAddress required (0x...)" });
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
