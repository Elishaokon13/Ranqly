"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ContestEntry } from "@/lib/mock-data";

const SCORE_MIN = 0;
const SCORE_MAX = 100;

interface JudgingPanelProps {
  contestId: string;
  contestTitle: string;
  entries: ContestEntry[];
}

export function JudgingPanel({
  contestId,
  contestTitle,
  entries,
}: JudgingPanelProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const setScore = (entryId: string, value: number) => {
    const clamped = Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
    setScores((prev) => ({ ...prev, [entryId]: clamped }));
  };

  const scoredCount = entries.filter((e) => scores[e.id] !== undefined).length;
  const allScored = entries.length > 0 && scoredCount === entries.length;

  const handleSubmit = async () => {
    setSubmitted(true);
    // Mock: in real app would submit to API
  };

  if (submitted) {
    return (
      <Card padding="lg">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-primary">
            Scores submitted
          </h3>
          <p className="max-w-sm text-sm text-text-secondary">
            Your scores have been recorded. They will be combined with other
            judges' scores when the phase ends.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/judge">Back to Judge dashboard</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/contest/${contestId}`}>View contest</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card padding="lg">
        <CardContent>
          <p className="text-sm text-text-tertiary">
            No entries to judge for this contest yet.
          </p>
          <Button variant="secondary" className="mt-4" asChild>
            <Link href={`/contest/${contestId}`}>Back to contest</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3">
        <p className="text-sm text-text-secondary">
          Score each entry from <strong className="text-text-primary">0 to {SCORE_MAX}</strong>.
          You've scored{" "}
          <strong className="text-primary-400">{scoredCount}</strong> / {entries.length}.
        </p>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!allScored}
        >
          Submit all scores
        </Button>
      </div>

      <ul className="space-y-4">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Card padding="md">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold text-text-primary">
                    {entry.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-text-tertiary">
                    {entry.description}
                  </p>
                  <p className="mt-1 text-xs text-text-disabled">{entry.author}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 -ml-2"
                    asChild
                  >
                    <a
                      href={entry.workUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Open entry
                    </a>
                  </Button>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <label htmlFor={`score-${entry.id}`} className="text-sm font-medium text-text-secondary">
                    Score
                  </label>
                  <input
                    id={`score-${entry.id}`}
                    type="number"
                    min={SCORE_MIN}
                    max={SCORE_MAX}
                    value={scores[entry.id] ?? ""}
                    onChange={(e) =>
                      setScore(entry.id, e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    placeholder="0–100"
                    className={cn(
                      "h-10 w-20 rounded-xl border border-border-subtle bg-bg-secondary px-3 text-center text-sm text-text-primary",
                      "focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
