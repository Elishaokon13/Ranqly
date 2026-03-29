import path from "path";
import fs from "fs";
import { Router, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { RequestWithAuth, requireAuth } from "../middleware/auth";

const router = Router();

function resolveAvatarUploadDir(): string {
  const fromRoot = path.join(process.cwd(), "public", "uploads", "avatars");
  const fromBackend = path.join(process.cwd(), "..", "public", "uploads", "avatars");
  const dir = fs.existsSync(path.join(process.cwd(), "public")) ? fromRoot : fromBackend;
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, resolveAvatarUploadDir());
  },
  filename: (req, file, cb) => {
    const uid = (req as RequestWithAuth).userId ?? "anon";
    const ext = path.extname(file.originalname || "").slice(0, 8) || ".png";
    const safeExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : ".png";
    cb(null, `${uid}-${Date.now()}${safeExt}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const imageMime = file.mimetype.startsWith("image/");
    const byExt = /\.(png|jpe?g|webp|gif|heic|heif|avif)$/i.test(name);
    if (!imageMime && !byExt) {
      cb(new Error("Only image files are allowed (e.g. PNG, JPEG, WebP, HEIC)."));
      return;
    }
    cb(null, true);
  },
});

const patchMeBody = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().toLowerCase().email().max(320).optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .refine((s) => !s || s.startsWith("/") || /^https?:\/\//i.test(s), {
      message: "avatarUrl must be a path or http(s) URL",
    }),
});

/** GET /api/me/submissions — current user's submissions across all contests */
router.get("/submissions", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const submissions = await prisma.submission.findMany({
    where: { authorId: req.userId! },
    include: { contest: { select: { id: true, slug: true, title: true, phase: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items: submissions });
});

/** POST /api/me/avatar — upload profile image; returns { avatarUrl } */
router.post(
  "/avatar",
  requireAuth as any,
  (req, res, next) => {
    uploadAvatar.single("avatar")(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
        return;
      }
      next();
    });
  },
  async (req: RequestWithAuth, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Missing file field "avatar"' });
      return;
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await prisma.user.update({
      where: { id: req.userId! },
      data: { avatarUrl },
    });
    res.json({ avatarUrl });
  }
);

/** PATCH /api/me — update name, email, and/or avatarUrl */
router.patch("/", requireAuth as any, async (req: RequestWithAuth, res: Response) => {
  const parsed = patchMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }
  const { name, email, avatarUrl } = parsed.data;
  if (name === undefined && avatarUrl === undefined && email === undefined) {
    res.status(400).json({ error: "Provide at least one of name, email, avatarUrl" });
    return;
  }
  if (email !== undefined) {
    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: req.userId! } },
      select: { id: true },
    });
    if (taken) {
      res.status(409).json({ error: "That email is already linked to another account." });
      return;
    }
  }
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
    select: {
      id: true,
      walletAddress: true,
      email: true,
      path: true,
      name: true,
      avatarUrl: true,
      organizerVerified: true,
    },
  });
  res.json(user);
});

export default router;
