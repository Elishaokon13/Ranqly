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
const boolOpt = zod_1.z.boolean().optional();
const notificationPrefsSchema = zod_1.z
    .object({
    contestUpdates: boolOpt,
    rankChanges: boolOpt,
    commentsOnEntries: boolOpt,
    votingReminders: boolOpt,
    weeklyDigest: boolOpt,
    marketingEmails: boolOpt,
    pushRankChanges: boolOpt,
    pushPhaseTransitions: boolOpt,
    pushNewContests: boolOpt,
})
    .strict();
const privacyPrefsSchema = zod_1.z
    .object({
    publicProfile: boolOpt,
    showSubmissions: boolOpt,
    showContestHistory: boolOpt,
    showEarnings: boolOpt,
    showWinRate: boolOpt,
    showVotesCast: boolOpt,
    anonymizedResearch: boolOpt,
    organizerContact: boolOpt,
})
    .strict();
const securityPrefsSchema = zod_1.z
    .object({
    twoFactorEnabled: boolOpt,
})
    .strict();
const preferencesPatchSchema = zod_1.z
    .object({
    notifications: notificationPrefsSchema.optional(),
    privacy: privacyPrefsSchema.optional(),
    security: securityPrefsSchema.optional(),
})
    .strict();
function asJsonObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function mergePreferences(existing, patch) {
    const base = asJsonObject(existing);
    const next = { ...base };
    if (patch.notifications) {
        next.notifications = { ...asJsonObject(base.notifications), ...patch.notifications };
    }
    if (patch.privacy) {
        next.privacy = { ...asJsonObject(base.privacy), ...patch.privacy };
    }
    if (patch.security) {
        next.security = { ...asJsonObject(base.security), ...patch.security };
    }
    return next;
}
const patchMeBody = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(80).optional(),
    email: zod_1.z.string().trim().toLowerCase().email().max(320).optional(),
    avatarUrl: zod_1.z
        .string()
        .trim()
        .max(2048)
        .optional()
        .refine((s) => !s || s.startsWith("/") || /^https?:\/\//i.test(s), {
        message: "avatarUrl must be a path or http(s) URL",
    }),
    preferences: preferencesPatchSchema.optional(),
});
const userMeSelect = {
    id: true,
    walletAddress: true,
    email: true,
    path: true,
    name: true,
    avatarUrl: true,
    preferences: true,
    organizerVerified: true,
};
router.get("/submissions", auth_1.requireAuth, async (req, res) => {
    const submissions = await prisma_1.prisma.submission.findMany({
        where: { authorId: req.userId },
        include: { contest: { select: { id: true, slug: true, title: true, phase: true } } },
        orderBy: { createdAt: "desc" },
    });
    res.json({ items: submissions });
});
router.get("/export", auth_1.requireAuth, async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.userId },
        select: {
            id: true,
            walletAddress: true,
            email: true,
            name: true,
            avatarUrl: true,
            path: true,
            preferences: true,
            organizerVerified: true,
            createdAt: true,
            updatedAt: true,
            submissions: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    workUrl: true,
                    createdAt: true,
                    contest: { select: { slug: true, title: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 500,
            },
            votes: {
                select: { id: true, direction: true, createdAt: true },
                orderBy: { createdAt: "desc" },
                take: 200,
            },
        },
    });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="ranqly-account-export.json"');
    res.json({ exportedAt: new Date().toISOString(), user });
});
router.post("/delete-account", auth_1.requireAuth, async (req, res) => {
    const parsed = zod_1.z.object({ confirmation: zod_1.z.literal("DELETE_MY_ACCOUNT") }).safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            error: "Invalid confirmation",
            message: 'Send JSON body: { "confirmation": "DELETE_MY_ACCOUNT" }',
        });
        return;
    }
    await prisma_1.prisma.user.delete({ where: { id: req.userId } });
    res.json({ ok: true });
});
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
router.patch("/", auth_1.requireAuth, async (req, res) => {
    const parsed = patchMeBody.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
        return;
    }
    const { name, email, avatarUrl, preferences } = parsed.data;
    if (name === undefined &&
        email === undefined &&
        avatarUrl === undefined &&
        preferences === undefined) {
        res.status(400).json({ error: "Provide at least one of name, email, avatarUrl, preferences" });
        return;
    }
    if (email !== undefined) {
        const taken = await prisma_1.prisma.user.findFirst({
            where: { email, NOT: { id: req.userId } },
            select: { id: true },
        });
        if (taken) {
            res.status(409).json({ error: "That email is already linked to another account." });
            return;
        }
    }
    const data = {};
    if (name !== undefined)
        data.name = name;
    if (email !== undefined)
        data.email = email;
    if (avatarUrl !== undefined)
        data.avatarUrl = avatarUrl;
    if (preferences !== undefined) {
        const current = await prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: { preferences: true },
        });
        data.preferences = mergePreferences(current?.preferences ?? null, preferences);
    }
    const user = await prisma_1.prisma.user.update({
        where: { id: req.userId },
        data,
        select: userMeSelect,
    });
    res.json(user);
});
/** GET /api/me/organized-contests — contests created by the current user (organizer) */
router.get("/organized-contests", auth_1.requireAuth, async (req, res) => {
    const contests = await prisma_1.prisma.contest.findMany({
        where: { organizerId: req.userId },
        include: { organizer: { select: { id: true, name: true, avatarUrl: true, organizerVerified: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    const list = contests.map((c) => ({ ...c, prizeAmount: c.prizeAmount.toString() }));
    const items = await Promise.all(list.map(async (c) => ({
        ...c,
        submissionsCount: await prisma_1.prisma.submission.count({ where: { contestId: c.id } }),
    })));
    res.json({ items });
});
/** GET /api/me/judging — contests where the user is an accepted judge (judging/finalization only) + progress */
router.get("/judging", auth_1.requireAuth, async (req, res) => {
    const assignments = await prisma_1.prisma.judgeAssignment.findMany({
        where: { userId: req.userId, status: "accepted" },
        include: {
            contest: {
                include: {
                    organizer: { select: { id: true, name: true, avatarUrl: true, organizerVerified: true } },
                },
            },
        },
    });
    const phases = new Set(["judging", "finalization"]);
    const items = [];
    for (const a of assignments) {
        if (!phases.has(a.contest.phase))
            continue;
        const total = await prisma_1.prisma.submission.count({ where: { contestId: a.contestId } });
        const scored = await prisma_1.prisma.judgeScore.count({
            where: { judgeId: req.userId, submission: { contestId: a.contestId } },
        });
        items.push({ contest: a.contest, scored, total });
    }
    res.json({ items });
});
exports.default = router;
