/**
 * Ranqly Backend — Bull worker entrypoint
 * Run: npm run worker (requires REDIS_URL)
 * Processes jobs from queues (scoring, notifications, etc.)
 */
import "dotenv/config";
import Queue from "bull";
import { prisma } from "./lib/prisma";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Placeholder queues — add real job processors as needed
const scoreQueue = new Queue("contest-score", REDIS_URL, {
  defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 1000 } },
});

scoreQueue.process(async (job) => {
  const { contestId } = job.data as { contestId: string };
  console.log(`[worker] Processing score job for contest ${contestId}`);
  // TODO: compute algorithm/community/judge blend and update submission ranks
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    throw new Error(`Contest not found: ${contestId}`);
  }
  // Placeholder: no-op for now
  return { contestId, processed: true };
});

// Optional: notification queue placeholder
const notifyQueue = new Queue("notify", REDIS_URL);
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
