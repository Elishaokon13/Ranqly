"use client";

import { useState, useEffect } from "react";
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
import type { SubmissionStatus } from "@/lib/contest-types";
import { isApiConfigured, fetchMySubmissions, type MySubmissionFromApi } from "@/lib/api";

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

function toStatus(s: string): SubmissionStatus {
  return (["pending", "scored", "won", "withdrawn"].includes(s) ? s : "pending") as SubmissionStatus;
}

function formatSubmittedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<MySubmissionFromApi[]>([]);

  useEffect(() => {
    if (!isApiConfigured()) return;
    let cancelled = false;
    fetchMySubmissions().then((items) => {
      if (cancelled || !items) return;
      setSubmissions(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleWithdraw = (sub: MySubmissionFromApi) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: "withdrawn" } : s))
    );
  };

  const activeSubmissions = submissions.filter((s) => s.status !== "withdrawn");

  return (
    <RequireAuth message="Sign in to view and manage your submissions.">
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
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
            const st = toStatus(sub.status);
            const slug = sub.contest?.slug ?? sub.contestId;
            const canEdit = sub.contest?.phase === "submission" && st === "pending";

            return (
              <motion.li
                key={sub.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-text-primary">
                        {sub.title}
                      </h2>
                      <Badge variant={STATUS_VARIANT[st]} size="sm">
                        {STATUS_LABELS[st]}
                      </Badge>
                      {sub.rank != null && st === "won" && (
                        <span className="inline-flex items-center gap-1 text-sm text-warning">
                          <Trophy className="h-4 w-4" />
                          Rank #{sub.rank}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-text-tertiary line-clamp-1">
                      <Link
                        href={`/contest/${slug}`}
                        className="hover:text-primary-400 transition-colors"
                      >
                        {sub.contest?.title ?? "Contest"}
                      </Link>
                      {sub.contest?.organizer?.name ? (
                        <>{" · "}{sub.contest.organizer.name}</>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-text-disabled">
                      Submitted {formatSubmittedAt(sub.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/contest/${slug}/submission/${sub.id}`}>
                        View
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/contest/${slug}`}>
                        View contest
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/contest/${slug}/submit?edit=${sub.id}`}>
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
