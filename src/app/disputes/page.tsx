"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, FileWarning } from "lucide-react";
import { Button, Badge, Card, CardContent, EmptyState } from "@/components/ui";
import { fetchDisputes, fetchContests } from "@/lib/api";
import type { DisputeListItem } from "@/lib/api";
import type { Contest } from "@/lib/contest-types";

const DISPUTE_PHASE = "disputes";

type DisputeStatus = "open" | "under_review" | "resolved";

const STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  under_review: "Under review",
  resolved: "Resolved",
};

const TYPE_LABELS: Record<string, string> = {
  plagiarism: "Plagiarism",
  rule_violation: "Rule violation",
  other: "Other",
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<DisputeListItem[]>([]);
  const [disputeContests, setDisputeContests] = useState<Contest[]>([]);

  useEffect(() => {
    void fetchDisputes().then(setDisputes);
    void fetchContests({ limit: 100 }).then((c) =>
      setDisputeContests(c.filter((x) => x.phase === DISPUTE_PHASE))
    );
  }, []);

  const hasDisputes = disputes.length > 0;

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Disputes
        </h1>
        <p className="mt-2 text-text-secondary">
          File disputes or nominate entries during the disputes phase. Track your submissions here.
        </p>
      </motion.div>

      {hasDisputes ? (
        <div className="space-y-4">
          {disputes.map((d, i) => {
            const st = d.status as DisputeStatus;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={d.status === "resolved" ? "success" : "warning"}
                          size="sm"
                        >
                          {STATUS_LABELS[st] ?? d.status}
                        </Badge>
                        <Badge variant="default" size="sm">
                          {TYPE_LABELS[d.type] ?? d.type}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-text-primary">
                        {d.submission.title} · {d.contest.title}
                      </p>
                      <p className="mt-1 text-xs text-text-tertiary line-clamp-1">
                        {d.summary}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/contest/${d.contest.slug}?tab=discussion`}>
                        View contest
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EmptyState
            icon={<FileWarning className="h-12 w-12" />}
            title="No disputes filed"
            description="You haven't filed any disputes. During the disputes phase of a contest, you can flag rule violations or nominate underrated entries from the contest page."
            action={
              <Button asChild>
                <Link href="/explore">Explore contests</Link>
              </Button>
            }
          />
        </motion.div>
      )}

      {disputeContests.length > 0 && (
        <motion.section
          className="mt-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="mb-3 font-display text-lg font-semibold text-text-primary">
            Contests in disputes phase
          </h2>
          <p className="mb-4 text-sm text-text-tertiary">
            You can file a dispute or nominate an entry from these contests.
          </p>
          <ul className="space-y-2">
            {disputeContests.map((contest) => (
              <li key={contest.id}>
                <Link
                  href={`/contest/${contest.id}?tab=submissions`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 transition-colors hover:border-primary-500/40 hover:bg-bg-tertiary/50"
                >
                  <span className="font-medium text-text-primary">
                    {contest.title}
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </Link>
              </li>
            ))}
          </ul>
        </motion.section>
      )}
    </div>
  );
}
