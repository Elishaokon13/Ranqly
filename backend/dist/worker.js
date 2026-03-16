"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Ranqly Backend — Bull worker entrypoint
 * Run: npm run worker (requires REDIS_URL)
 * Processes jobs from queues (scoring, notifications, etc.)
 */
require("dotenv/config");
const bull_1 = __importDefault(require("bull"));
const prisma_1 = require("./lib/prisma");
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
// Placeholder queues — add real job processors as needed
const scoreQueue = new bull_1.default("contest-score", REDIS_URL, {
    defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 1000 } },
});
scoreQueue.process(async (job) => {
    const { contestId } = job.data;
    console.log(`[worker] Processing score job for contest ${contestId}`);
    // TODO: compute algorithm/community/judge blend and update submission ranks
    const contest = await prisma_1.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) {
        throw new Error(`Contest not found: ${contestId}`);
    }
    // Placeholder: no-op for now
    return { contestId, processed: true };
});
// Optional: notification queue placeholder
const notifyQueue = new bull_1.default("notify", REDIS_URL);
notifyQueue.process(async (job) => {
    console.log(`[worker] Notify job: ${job.name}`, job.data);
    return { ok: true };
});
console.log("[worker] Ranqly worker started (queues: contest-score, notify)");
process.on("SIGTERM", () => {
    scoreQueue.close();
    notifyQueue.close();
    process.exit(0);
});
