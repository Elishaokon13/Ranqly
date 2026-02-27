"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gavel, ChevronRight } from "lucide-react";
import { Button, Card, CardContent, EmptyState, Progress } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  MOCK_CONTESTS,
  getEntriesByContestId,
  MOCK_JUDGE_PROGRESS,
  PHASE_LABELS,
} from "@/lib/mock-data";

const JUDGING_PHASES = ["judging", "finalization"] as const;

export default function JudgeDashboardPage() {
  const assignments = MOCK_CONTESTS.filter((c) =>
    JUDGING_PHASES.includes(c.phase as (typeof JUDGING_PHASES)[number])
  );

  return (
    <RequireAuth message="Sign in to access the judge dashboard.">
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Judge dashboard
        </h1>
        <p className="mt-2 text-text-secondary">
          Contests you're assigned to judge. Score each entry before the deadline.
        </p>
      </motion.div>

      {assignments.length > 0 ? (
        <ul className="space-y-4">
          {assignments.map((contest, i) => {
            const entries = getEntriesByContestId(contest.id);
            const total = entries.length;
            const scored = MOCK_JUDGE_PROGRESS[contest.id] ?? 0;
            const pct = total > 0 ? (scored / total) * 100 : 0;

            return (
              <motion.li
                key={contest.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated text-sm font-bold text-text-primary">
                        {contest.organizer.logo}
                      </div>
                      <div>
                        <h2 className="font-display font-semibold text-text-primary">
                          {contest.title}
                        </h2>
                        <p className="text-sm text-text-tertiary">
                          {contest.organizer.name} · {PHASE_LABELS[contest.phase]}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-text-tertiary">Progress</span>
                        <span className="font-medium text-text-primary">
                          {scored} / {total} entries scored
                        </span>
                      </div>
                      <Progress value={pct} size="sm" variant="primary" />
                    </div>
                  </div>
                  <Button size="sm" asChild className="shrink-0">
                    <Link href={`/contest/${contest.id}/judge`}>
                      Judge now
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              </motion.li>
            );
          })}
        </ul>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EmptyState
            icon={<Gavel className="h-12 w-12" />}
            title="No judging assignments"
            description="You don't have any contests to judge right now. Assignments appear when a contest enters the judging phase."
            action={
              <Button asChild>
                <Link href="/explore">Explore contests</Link>
              </Button>
            }
          />
        </motion.div>
      )}
    </div>
    </RequireAuth>
  );
}
