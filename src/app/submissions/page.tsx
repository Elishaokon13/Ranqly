"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Pencil,
  Trash2,
  Trophy,
  Inbox,
  ChevronRight,
} from "lucide-react";
import { Button, Badge, Card, EmptyState } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  MOCK_MY_SUBMISSIONS,
  MOCK_CONTESTS,
  type MySubmission,
  type SubmissionStatus,
} from "@/lib/mock-data";

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  scored: "Scored",
  won: "Won",
  withdrawn: "Withdrawn",
};

const STATUS_VARIANT: Record<SubmissionStatus, "default" | "primary" | "success" | "warning"> = {
  pending: "default",
  scored: "primary",
  won: "success",
  withdrawn: "default",
};

function getContest(contestId: string) {
  return MOCK_CONTESTS.find((c) => c.id === contestId);
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<MySubmission[]>(MOCK_MY_SUBMISSIONS);

  const handleWithdraw = (sub: MySubmission) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === sub.id ? { ...s, status: "withdrawn" as const } : s
      )
    );
  };

  const activeSubmissions = submissions.filter((s) => s.status !== "withdrawn");

  return (
    <RequireAuth message="Sign in to view and manage your submissions.">
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-bold text-text-primary">
          My submissions
        </h1>
        <p className="mt-2 text-text-secondary">
          View and manage your contest entries. Edit or withdraw while submissions are open.
        </p>
      </motion.div>

      {activeSubmissions.length > 0 ? (
        <ul className="space-y-4">
          {activeSubmissions.map((sub, i) => {
            const contest = getContest(sub.contestId);
            const canEdit = contest?.phase === "submission" && sub.status === "pending";

            return (
              <motion.li
                key={sub.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-text-primary">
                        {sub.title}
                      </h2>
                      <Badge variant={STATUS_VARIANT[sub.status]} size="sm">
                        {STATUS_LABELS[sub.status]}
                      </Badge>
                      {sub.rank != null && sub.status === "won" && (
                        <span className="inline-flex items-center gap-1 text-sm text-warning">
                          <Trophy className="h-4 w-4" />
                          Rank #{sub.rank}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-text-tertiary line-clamp-1">
                      <Link
                        href={`/contest/${sub.contestId}`}
                        className="hover:text-primary-400 transition-colors"
                      >
                        {contest?.title}
                      </Link>
                      {" · "}
                      {contest?.organizer.name}
                    </p>
                    <p className="mt-1 text-xs text-text-disabled">
                      Submitted {sub.submittedAt}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/contest/${sub.contestId}/submission/${sub.id}`}>
                        View
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/contest/${sub.contestId}`}>
                        View contest
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/contest/${sub.contestId}/submit?edit=${sub.id}`}>
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error/10 hover:text-error"
                          onClick={() => handleWithdraw(sub)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Withdraw
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={sub.workUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        Open link
                      </a>
                    </Button>
                  </div>
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
            icon={<Inbox className="h-12 w-12" />}
            title="No submissions yet"
            description="You haven't submitted to any contests. Find a contest and submit your best work."
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
