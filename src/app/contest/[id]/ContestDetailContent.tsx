"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Clock,
  Flame,
  Sparkles,
  Trophy,
  Users,
  Share2,
  Flag,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Cpu,
  Vote,
  Scale,
  ExternalLink,
  UserPlus,
  Upload,
  AlertTriangle,
  ListOrdered,
  CheckCircle2,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  type Contest,
  PHASE_LABELS,
  CATEGORY_LABELS,
  getEntriesByContestId,
} from "@/lib/mock-data";
import { VotingPanel, LeaderboardPanel } from "@/components/contest";

const PHASES_ORDER: Contest["phase"][] = [
  "submission",
  "scoring",
  "disputes",
  "voting",
  "judging",
  "finalization",
  "completed",
];

// Mock stats not on Contest type
function getDerivedStats(contest: Contest) {
  return {
    votes: Math.floor(contest.submissionsCount * 12),
    judges: 5,
    comments: Math.floor(contest.submissionsCount * 2),
  };
}

function getPhaseIndex(phase: Contest["phase"]) {
  const i = PHASES_ORDER.indexOf(phase);
  return i >= 0 ? i : 0;
}

type PhaseCtaConfig = {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getPhaseCta(contest: Contest): PhaseCtaConfig {
  const base = `/contest/${contest.id}`;
  switch (contest.phase) {
    case "submission":
      return {
        title: "Submit your entry",
        description: "Submissions are open. Submit before the deadline.",
        primaryLabel: "Submit entry",
        primaryHref: `${base}/submit`,
        icon: Upload,
      };
    case "scoring":
      return {
        title: "Scoring in progress",
        description: "Algorithm is scoring entries. Leaderboard preview soon.",
        primaryLabel: "View submissions",
        primaryHref: base,
        icon: Cpu,
      };
    case "disputes":
      return {
        title: "Disputes open",
        description: "Flag issues or nominate underrated entries.",
        primaryLabel: "File dispute",
        primaryHref: `${base}?tab=discussion`,
        secondaryLabel: "Nominate entry",
        secondaryHref: `${base}?tab=submissions`,
        icon: AlertTriangle,
      };
    case "voting":
      return {
        title: "Community voting",
        description: "PoI NFT holders can vote. Use your 5 upvotes and 2 downvotes.",
        primaryLabel: "Vote now",
        primaryHref: `${base}?tab=submissions`,
        icon: Vote,
      };
    case "judging":
      return {
        title: "Expert judging",
        description: "Judges are reviewing entries. Results coming soon.",
        primaryLabel: "View leaderboard",
        primaryHref: `${base}?tab=leaderboard`,
        icon: Scale,
      };
    case "finalization":
      return {
        title: "Finalizing results",
        description: "Scores are being combined. Winners will be announced shortly.",
        primaryLabel: "View leaderboard",
        primaryHref: `${base}?tab=leaderboard`,
        icon: ListOrdered,
      };
    case "completed":
      return {
        title: "Contest ended",
        description: "Winners have been announced. View the final leaderboard.",
        primaryLabel: "View results",
        primaryHref: `${base}?tab=leaderboard`,
        icon: CheckCircle2,
      };
    default:
      return {
        title: "Your status",
        description: "See how you can participate.",
        primaryLabel: "View contest",
        primaryHref: base,
        icon: Trophy,
      };
  }
}

interface ContestDetailContentProps {
  contest: Contest;
}

export function ContestDetailContent({ contest }: ContestDetailContentProps) {
  const [scoringOpen, setScoringOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const stats = getDerivedStats(contest);
  const phaseIndex = getPhaseIndex(contest.phase);
  const phaseProgress = contest.phase === "completed" ? 100 : (phaseIndex / (PHASES_ORDER.length - 1)) * 100;
  const isCompleted = contest.phase === "completed";
  const isEndingSoon = contest.daysRemaining > 0 && contest.daysRemaining <= 1;

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs = ["overview", "leaderboard", "submissions", "rules", "discussion"] as const;
  const defaultTab = tabParam && validTabs.includes(tabParam as (typeof validTabs)[number])
    ? (tabParam as (typeof validTabs)[number])
    : "overview";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* ─── Left column ─── */}
        <div className="min-w-0 space-y-6">
          {/* Banner — cover only (image or gradient, no text) */}
          <div
            className={cn(
              "relative h-48 w-full overflow-hidden rounded-2xl bg-linear-to-br sm:h-56",
              contest.bannerColor,
              isCompleted && "grayscale"
            )}
          >
            {contest.bannerImage && (
              <Image
                src={contest.bannerImage}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, min(calc(100vw - 380px - 3rem), 800px)"
              />
            )}
            <div className={cn("absolute inset-0 rounded-2xl", contest.bannerImage ? "bg-black/40" : "bg-black/10")} aria-hidden />
          </div>

          {/* Header: organizer + title + badges */}
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-border-subtle bg-bg-elevated text-sm font-bold text-text-primary">
              {contest.organizer.logo}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">
                  {contest.organizer.name}
                </span>
                {contest.organizer.verified && (
                  <span className="text-primary-400 text-xs">✓ Verified</span>
                )}
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold text-text-primary sm:text-3xl">
                {contest.title}
              </h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="primary" size="sm">
                  {CATEGORY_LABELS[contest.category]}
                </Badge>
                <Badge variant="default" size="sm">
                  {PHASE_LABELS[contest.phase]}
                </Badge>
                {contest.hot && (
                  <Badge variant="hot" size="sm">
                    <Flame className="h-3 w-3" /> HOT
                  </Badge>
                )}
                {isEndingSoon && (
                  <Badge variant="warning" size="sm">
                    <Clock className="h-3 w-3" /> ENDING SOON
                  </Badge>
                )}
                {contest.preTge && (
                  <Badge variant="info" size="sm">
                    <Sparkles className="h-3 w-3" /> PRE-TGE
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Phase callout */}
          {!isCompleted && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                contest.phase === "submission" && "border-accent-500/40 bg-accent-500/10 text-accent-400",
                contest.phase === "voting" && "border-primary-500/40 bg-primary-500/10 text-primary-400",
                (contest.phase === "judging" || contest.phase === "finalization") && "border-border-medium bg-bg-tertiary text-text-secondary",
                (contest.phase === "scoring" || contest.phase === "disputes") && "border-warning/40 bg-warning/10 text-warning"
              )}
            >
              {contest.phase === "submission" && "Submissions are open — submit your entry before the deadline."}
              {contest.phase === "scoring" && "Algorithmic scoring in progress. Leaderboard preview will appear as scores complete."}
              {contest.phase === "disputes" && "Disputes & nominations window is open. File a dispute or nominate an underrated entry."}
              {contest.phase === "voting" && "Community voting is live. PoI NFT holders can vote with 5 upvotes and 2 downvotes."}
              {contest.phase === "judging" && "Expert judges are reviewing entries. Final results will be published soon."}
              {contest.phase === "finalization" && "Final scores are being calculated. Winners will be announced shortly."}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
                <section>
                  <h2 className="font-display text-lg font-semibold text-text-primary">
                    Description
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {contest.description}
                  </p>
                </section>
                <section>
                  <h2 className="font-display text-lg font-semibold text-text-primary">
                    Requirements
                  </h2>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-text-secondary">
                    <li>Original content only; no plagiarism</li>
                    <li>Submit before the contest deadline</li>
                    <li>Include a clear title and description</li>
                    <li>Link to your work (article, video, or design)</li>
                  </ul>
                </section>
                <section>
                  <h2 className="font-display text-lg font-semibold text-text-primary">
                    Judging criteria
                  </h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    Entries are scored across depth, reach, relevance, and consistency.
                    Final rank combines algorithmic score (40%), community votes (30%),
                    and expert judge scores (30%).
                  </p>
                </section>
                <section>
                  <h2 className="font-display text-lg font-semibold text-text-primary">
                    Key dates
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-secondary">
                    <span>Start: {contest.startDate}</span>
                    <span>End: {contest.endDate}</span>
                    {contest.daysRemaining > 0 && (
                      <span className="font-medium text-warning">
                        {contest.daysRemaining} days left
                      </span>
                    )}
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard">
              <LeaderboardPanel
                contest={contest}
                entries={getEntriesByContestId(contest.id)}
              />
            </TabsContent>

            <TabsContent value="submissions">
              {contest.phase === "voting" ? (
                (() => {
                  const entries = getEntriesByContestId(contest.id);
                  return entries.length > 0 ? (
                    <VotingPanel contestId={contest.id} entries={entries} />
                  ) : (
                    <Card padding="lg">
                      <CardContent>
                        <p className="text-sm text-text-tertiary">
                          No entries available to vote on yet. Check back when submissions are in.
                        </p>
                      </CardContent>
                    </Card>
                  );
                })()
              ) : (
                <Card padding="lg">
                  <CardContent>
                    <p className="text-sm text-text-tertiary">
                      {contest.submissionsCount} submissions. Browse and filter entries
                      here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rules">
              <Card padding="lg">
                <CardContent>
                  <p className="text-sm text-text-tertiary">
                    Official rules and eligibility will be displayed here. Refer to
                    the contest description and requirements in the Overview tab.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussion">
              <Card padding="lg">
                <CardContent>
                  <p className="text-sm text-text-tertiary">
                    Community discussion ({stats.comments} comments). Discussion
                    thread UI can be added in a later phase.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Phase indicator card */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Contest phase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Current phase</span>
                  <span className="font-medium text-primary-400">
                    {PHASE_LABELS[contest.phase]}
                  </span>
                </div>
                <Progress
                  value={phaseProgress}
                  size="sm"
                  className="mt-2"
                  variant="primary"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PHASES_ORDER.map((p) => (
                  <Badge
                    key={p}
                    variant={p === contest.phase ? "primary" : "default"}
                    size="sm"
                  >
                    {PHASE_LABELS[p]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scoring breakdown (expandable) */}
          <Card padding="none">
            <button
              type="button"
              onClick={() => setScoringOpen((o) => !o)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-bg-tertiary"
            >
              <span className="font-display text-lg font-semibold text-text-primary">
                Scoring breakdown
              </span>
              {scoringOpen ? (
                <ChevronUp className="h-5 w-5 text-text-tertiary" />
              ) : (
                <ChevronDown className="h-5 w-5 text-text-tertiary" />
              )}
            </button>
            {scoringOpen && (
              <div className="border-t border-border-subtle p-4 pt-0">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-xl bg-bg-tertiary p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20">
                      <Cpu className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">40% Algorithm</p>
                      <p className="text-xs text-text-tertiary">
                        Depth, reach, relevance, consistency
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-bg-tertiary p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/20">
                      <Vote className="h-5 w-5 text-accent-400" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">30% Community</p>
                      <p className="text-xs text-text-tertiary">
                        PoI NFT holder votes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-bg-tertiary p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tier-platinum-from/20">
                      <Scale className="h-5 w-5 text-tier-platinum-from" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">30% Judge</p>
                      <p className="text-xs text-text-tertiary">
                        Expert panel scores
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ─── Right sidebar (sticky) ─── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4">
            {/* Prize pool */}
            <Card padding="md">
              <CardContent className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15">
                  <Trophy className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-tertiary">
                    Prize pool
                  </p>
                  <p className="font-display text-xl font-bold text-text-primary">
                    {contest.prizePool}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Top {contest.winnersCount} winners
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-text-secondary">
                <p>Start: {contest.startDate}</p>
                <p>End: {contest.endDate}</p>
                {contest.daysRemaining > 0 && (
                  <p className="font-medium text-warning">
                    {contest.daysRemaining} days remaining
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card padding="md">
              <CardHeader>
                <CardTitle className="text-base">Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-tertiary">Entries</p>
                  <p className="font-semibold text-text-primary">
                    {contest.submissionsCount}
                    {contest.maxSubmissions > 0 && ` / ${contest.maxSubmissions}`}
                  </p>
                </div>
                <div>
                  <p className="text-text-tertiary">Votes</p>
                  <p className="font-semibold text-text-primary">{stats.votes}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">Judges</p>
                  <p className="font-semibold text-text-primary">{stats.judges}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">Comments</p>
                  <p className="font-semibold text-text-primary">{stats.comments}</p>
                </div>
              </CardContent>
            </Card>

            {/* Your status — phase-specific CTA */}
            {(() => {
              const cta = getPhaseCta(contest);
              const Icon = cta.icon;
              return (
                <Card padding="md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-primary-400" />
                      {cta.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-text-tertiary">{cta.description}</p>
                    <Button className="w-full" size="lg" asChild>
                      <Link href={cta.primaryHref}>{cta.primaryLabel}</Link>
                    </Button>
                    {cta.secondaryLabel && cta.secondaryHref && (
                      <Button variant="secondary" className="w-full" size="sm" asChild>
                        <Link href={cta.secondaryHref}>{cta.secondaryLabel}</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Organizer */}
            <Card padding="md">
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated text-sm font-bold text-text-primary">
                    {contest.organizer.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">
                      {contest.organizer.name}
                    </p>
                    {contest.organizer.verified && (
                      <p className="text-xs text-primary-400">Verified organizer</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" asChild>
                    <Link href="#">
                      Visit <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="#">
                      <UserPlus className="mr-1 h-3 w-3" /> Join
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Share / Report / Bookmark */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm">
                <Share2 className="mr-1 h-4 w-4" /> Share
              </Button>
              <Button variant="ghost" size="sm">
                <Flag className="mr-1 h-4 w-4" /> Report
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBookmarked((b) => !b)}
              >
                <Bookmark
                  className={cn("mr-1 h-4 w-4", bookmarked && "fill-current")}
                />{" "}
                {bookmarked ? "Saved" : "Bookmark"}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
