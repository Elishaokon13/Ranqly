import Link from "next/link";
import Image from "next/image";
import { Clock, Flame, Sparkles, Trophy, Users, ArrowRight } from "lucide-react";
import { Badge, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  type Contest,
  PHASE_LABELS,
  CATEGORY_LABELS,
} from "@/lib/mock-data";

interface ContestCardProps {
  contest: Contest;
}

export function ContestCard({ contest }: ContestCardProps) {
  const progressPct =
    contest.maxSubmissions > 0
      ? (contest.submissionsCount / contest.maxSubmissions) * 100
      : 0;

  const isCompleted = contest.phase === "completed";
  const isEndingSoon = contest.daysRemaining > 0 && contest.daysRemaining <= 1;

  return (
    <Link
      href={`/contest/${contest.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary",
        "transition-all duration-200",
        "hover:-translate-y-1 hover:border-primary-500 hover:shadow-glow-primary",
        isCompleted && "opacity-75 hover:opacity-100"
      )}
    >
      {/* Banner — cover only (image or gradient, no text) */}
      <div
        className={cn(
          "relative h-[140px] w-full overflow-hidden bg-linear-to-br",
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
            sizes="(max-width: 640px) 100vw, 360px"
          />
        )}
        <div className={cn("absolute inset-0", contest.bannerImage ? "bg-black/40" : "bg-black/10")} aria-hidden />
        {/* Badges only — no text on cover */}
        <div className="absolute top-3 left-3 z-10 flex gap-1.5">
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
          {isCompleted && (
            <Badge variant="default" size="sm">ENDED</Badge>
          )}
        </div>
        {/* Organizer logo */}
        <div className="absolute -bottom-5 left-4 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-bg-secondary bg-bg-elevated text-xs font-bold text-text-primary shadow-md">
            {contest.organizer.logo}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 pt-7">
        {/* Organizer + Category */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-text-secondary">
              {contest.organizer.name}
            </span>
            {contest.organizer.verified && (
              <span className="text-primary-400 text-[10px]">✓</span>
            )}
          </div>
          <Badge variant="primary" size="sm">
            {CATEGORY_LABELS[contest.category]}
          </Badge>
        </div>

        {/* Title + Description */}
        <h3 className="text-base font-semibold text-text-primary font-display group-hover:text-primary-400 transition-colors">
          {contest.title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-text-tertiary line-clamp-2">
          {contest.description}
        </p>

        {/* Stats Row */}
        <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <Trophy className="h-3 w-3 text-warning" />
            <span className="font-semibold text-text-primary">{contest.prizePool}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Top {contest.winnersCount}</span>
          </div>
          {contest.daysRemaining > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{contest.daysRemaining}d left</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <Progress
            value={progressPct}
            size="sm"
            variant={isCompleted ? "warning" : "primary"}
          />
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-text-disabled">
            <span>{contest.submissionsCount} Submissions</span>
            <span>{PHASE_LABELS[contest.phase]}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 pt-3 border-t border-border-subtle">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-400 group-hover:gap-2 transition-all">
            {isCompleted ? "View Results" : "View Contest"}
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
