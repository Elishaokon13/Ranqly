"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Medal, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui";
import {
  MOCK_CONTESTS,
  getEntriesByContestId,
  PHASE_LABELS,
} from "@/lib/mock-data";

const PHASES_WITH_LEADERBOARD = ["judging", "finalization", "completed"] as const;

function getMockTotal(entryId: string) {
  const hash = entryId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const algorithm = 70 + (hash % 21);
  const community = 65 + ((hash * 3) % 26);
  const judge = 72 + ((hash * 7) % 19);
  return Math.round(algorithm * 0.4 + community * 0.3 + judge * 0.3);
}

export default function LeaderboardPage() {
  const contestsWithLeaderboard = MOCK_CONTESTS.filter((c) =>
    PHASES_WITH_LEADERBOARD.includes(c.phase as (typeof PHASES_WITH_LEADERBOARD)[number])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Leaderboard
        </h1>
        <p className="mt-2 text-text-secondary">
          Top entries across contests. Click a contest to see the full ranking.
        </p>
      </motion.div>

      <div className="space-y-8">
        {contestsWithLeaderboard.map((contest, ci) => {
          const entries = getEntriesByContestId(contest.id);
          const ranked = entries
            .map((entry) => ({
              entry,
              total: getMockTotal(entry.id),
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)
            .map((r, i) => ({ ...r, rank: i + 1 }));

          if (ranked.length === 0) return null;

          return (
            <motion.section
              key={contest.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: ci * 0.08 }}
            >
              <Link
                href={`/contest/${contest.id}?tab=leaderboard`}
                className="mb-3 flex items-center justify-between gap-2 rounded-lg py-1 transition-colors hover:bg-bg-tertiary/50"
              >
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  {contest.title}
                </h2>
                <span className="text-xs text-text-tertiary">
                  {contest.organizer.name} · {PHASE_LABELS[contest.phase]}
                </span>
              </Link>
              <Card padding="none">
                <CardContent className="p-0">
                  <ul>
                    {ranked.map(({ entry, rank, total }) => (
                      <li
                        key={entry.id}
                        className="flex items-center gap-4 border-b border-border-subtle/50 px-4 py-3 last:border-0"
                      >
                        <span
                          className={cn(
                            "font-numeric",
                            rank <= 3
                              ? "flex w-8 items-center gap-1 font-semibold text-warning"
                              : "w-8 text-sm font-medium text-text-tertiary"
                          )}
                        >
                          {rank <= 3 ? (
                            <Medal className="inline h-4 w-4" />
                          ) : null}
                          {rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text-primary">
                            {entry.title}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {entry.author}
                          </p>
                        </div>
                        <span className="font-numeric shrink-0 font-semibold text-text-primary">
                          {total}
                        </span>
                        <a
                          href={entry.workUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-text-tertiary hover:text-primary-400"
                          aria-label="Open entry"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <p className="mt-2 text-xs text-text-tertiary">
                <Link
                  href={`/contest/${contest.id}?tab=leaderboard`}
                  className="hover:text-primary-400"
                >
                  View full leaderboard →
                </Link>
              </p>
            </motion.section>
          );
        })}
      </div>

      {contestsWithLeaderboard.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card padding="lg">
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-text-disabled" />
              <p className="mt-4 text-sm text-text-tertiary">
                No leaderboards available yet. Leaderboards appear when contests
                reach the judging phase or complete.
              </p>
              <Link
                href="/explore"
                className="mt-4 inline-block text-sm font-medium text-primary-400 hover:underline"
              >
                Explore contests
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
