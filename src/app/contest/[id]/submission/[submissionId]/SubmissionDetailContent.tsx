import Link from "next/link";
import {
  ExternalLink,
  Trophy,
  Cpu,
  Vote,
  Scale,
  MessageCircle,
  Pencil,
} from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import {
  type Contest,
  type MySubmission,
  PHASE_LABELS,
  type ContestPhase,
} from "@/lib/mock-data";

const PHASES_WITH_SCORES: ContestPhase[] = [
  "scoring",
  "disputes",
  "voting",
  "judging",
  "finalization",
  "completed",
];

/** Mock scores for display when phase allows (deterministic from submission id). */
function getMockScores(submissionId: string) {
  const hash = submissionId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return {
    algorithm: 70 + (hash % 21),
    community: 65 + ((hash * 3) % 26),
    judge: 72 + ((hash * 7) % 19),
  };
}

function weightedTotal(s: { algorithm: number; community: number; judge: number }) {
  return Math.round(s.algorithm * 0.4 + s.community * 0.3 + s.judge * 0.3);
}

interface SubmissionDetailContentProps {
  contest: Contest;
  submission: MySubmission;
}

export function SubmissionDetailContent({
  contest,
  submission,
}: SubmissionDetailContentProps) {
  const showScores = PHASES_WITH_SCORES.includes(contest.phase);
  const scores = showScores ? getMockScores(submission.id) : null;
  const total = scores ? weightedTotal(scores) : null;
  const canEdit =
    contest.phase === "submission" && submission.status === "pending";

  return (
    <div className="space-y-6">
      {/* Contest context */}
      <Card padding="md">
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated text-sm font-bold text-text-primary">
            {contest.organizer.logo}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/contest/${contest.id}`}
              className="font-display text-lg font-semibold text-text-primary hover:text-primary-400 transition-colors"
            >
              {contest.title}
            </Link>
            <p className="text-sm text-text-tertiary">
              {contest.organizer.name}
              {contest.organizer.verified && (
                <span className="ml-1 text-primary-400">✓</span>
              )}
            </p>
          </div>
          <Badge variant="default" size="sm">
            {PHASE_LABELS[contest.phase]}
          </Badge>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/contest/${contest.id}`}>View contest</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Submission content */}
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              {submission.title}
            </h1>
            <p className="mt-1 text-sm text-text-disabled">
              Submitted {submission.submittedAt}
              {submission.rank != null && submission.status === "won" && (
                <span className="ml-3 inline-flex items-center gap-1 text-warning">
                  <Trophy className="h-4 w-4" />
                  Rank #{submission.rank}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                submission.status === "won"
                  ? "success"
                  : submission.status === "withdrawn"
                    ? "default"
                    : "primary"
              }
              size="sm"
            >
              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
            </Badge>
            {canEdit && (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/contest/${contest.id}/submit?edit=${submission.id}`}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-disabled">
              Description
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {submission.description}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-disabled">
              Link to work
            </h2>
            <Button variant="outline" size="sm" asChild>
              <a
                href={submission.workUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </a>
            </Button>
            <p className="mt-1.5 text-xs text-text-tertiary break-all">
              {submission.workUrl}
            </p>
          </section>
        </div>
      </Card>

      {/* Scores (when phase allows) */}
      {showScores && scores && total != null && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Scores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-bg-tertiary p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20">
                <Cpu className="h-5 w-5 text-primary-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">
                  Algorithm (40%)
                </p>
                <p className="text-xl font-semibold text-text-primary">
                  {scores.algorithm}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-bg-tertiary p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/20">
                <Vote className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">
                  Community (30%)
                </p>
                <p className="text-xl font-semibold text-text-primary">
                  {scores.community}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-bg-tertiary p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tier-platinum-from/20">
                <Scale className="h-5 w-5 text-tier-platinum-from" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary">
                  Judge (30%)
                </p>
                <p className="text-xl font-semibold text-text-primary">
                  {scores.judge}
                </p>
              </div>
            </div>
          </CardContent>
          <CardContent className="border-t border-border-subtle pt-4">
            <p className="text-sm text-text-tertiary">
              Weighted total:{" "}
              <span className="font-display text-lg font-semibold text-text-primary">
                {total}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Discussion placeholder */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-tertiary">
            Comments and discussion about this submission will appear here. This
            can be enabled in a later phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
