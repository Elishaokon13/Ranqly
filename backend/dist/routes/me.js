"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function resolveAvatarUploadDir() {
    const fromRoot = path_1.default.join(process.cwd(), "public", "uploads", "avatars");
    const fromBackend = path_1.default.join(process.cwd(), "..", "public", "uploads", "avatars");
    const dir = fs_1.default.existsSync(path_1.default.join(process.cwd(), "public")) ? fromRoot : fromBackend;
    fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
}
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, resolveAvatarUploadDir());
    },
    filename: (req, file, cb) => {
        const uid = req.userId ?? "anon";
        const ext = path_1.default.extname(file.originalname || "").slice(0, 8) || ".png";
        const safeExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : ".png";
        cb(null, `${uid}-${Date.now()}${safeExt}`);
    },
});
const uploadAvatar = (0, multer_1.default)({
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
const patchMeBody = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(80).optional(),
    avatarUrl: zod_1.z
        .string()
        .trim()
        .max(2048)
        .optional()
        .refine((s) => !s || s.startsWith("/") || /^https?:\/\//i.test(s), {
        message: "avatarUrl must be a path or http(s) URL",
    }),
});
/** GET /api/me/submissions — current user's submissions across all contests */
router.get("/submissions", auth_1.requireAuth, async (req, res) => {
    const submissions = await prisma_1.prisma.submission.findMany({
        where: { authorId: req.userId },
        include: { contest: { select: { id: true, slug: true, title: true, phase: true } } },
        orderBy: { createdAt: "desc" },
    });
    res.json({ items: submissions });
});
/** POST /api/me/avatar — upload profile image; returns { avatarUrl } */
router.post("/avatar", auth_1.requireAuth, (req, res, next) => {
    uploadAvatar.single("avatar")(req, res, (err) => {
        if (err) {
            res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed" });
            return;
        }
        next();
    });
}, async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'Missing file field "avatar"' });
        return;
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await prisma_1.prisma.user.update({
        where: { id: req.userId },
        data: { avatarUrl },
    });
    res.json({ avatarUrl });
});
/** PATCH /api/me — update name and/or avatarUrl */
router.patch("/", auth_1.requireAuth, async (req, res) => {
    const parsed = patchMeBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
        return;
    }
    const { name, avatarUrl } = parsed.data;
    if (name === undefined && avatarUrl === undefined) {
        res.status(400).json({ error: "Provide at least one of name, avatarUrl" });
        return;
    }
    const user = await prisma_1.prisma.user.update({
        where: { id: req.userId },
        data: {
            ...(name !== undefined ? { name } : {}),
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
exports.default = router;
