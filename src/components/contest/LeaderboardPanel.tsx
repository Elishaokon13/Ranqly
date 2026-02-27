"use client";

import Link from "next/link";
import { ExternalLink, Medal } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Contest, ContestEntry } from "@/lib/mock-data";

const PHASES_WITH_LEADERBOARD: Contest["phase"][] = [
  "scoring",
  "disputes",
  "voting",
  "judging",
  "finalization",
  "completed",
];

function getMockScores(entryId: string) {
  const hash = entryId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return {
    algorithm: 70 + (hash % 21),
    community: 65 + ((hash * 3) % 26),
    judge: 72 + ((hash * 7) % 19),
  };
}

function weightedTotal(s: {
  algorithm: number;
  community: number;
  judge: number;
}) {
  return Math.round(s.algorithm * 0.4 + s.community * 0.3 + s.judge * 0.3);
}

interface RankedEntry {
  entry: ContestEntry;
  rank: number;
  total: number;
  algorithm: number;
  community: number;
  judge: number;
}

interface LeaderboardPanelProps {
  contest: Contest;
  entries: ContestEntry[];
}

export function LeaderboardPanel({ contest, entries }: LeaderboardPanelProps) {
  const showLeaderboard = PHASES_WITH_LEADERBOARD.includes(contest.phase);

  if (!showLeaderboard) {
    return (
      <Card padding="lg">
        <CardContent>
          <p className="text-sm text-text-tertiary">
            Leaderboard will be available once scoring starts. Check back during
            the scoring, voting, or judging phase.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card padding="lg">
        <CardContent>
          <p className="text-sm text-text-tertiary">
            No entries yet. Leaderboard will appear when submissions are scored.
          </p>
        </CardContent>
      </Card>
    );
  }

  const ranked: RankedEntry[] = entries
    .map((entry) => {
      const scores = getMockScores(entry.id);
      const total = weightedTotal(scores);
      return {
        entry,
        total,
        algorithm: scores.algorithm,
        community: scores.community,
        judge: scores.judge,
      };
    })
    .sort((a, b) => b.total - a.total)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const topThreeClass = (rank: number) => {
    if (rank === 1) return "text-tier-gold-from";
    if (rank === 2) return "text-tier-silver-from";
    if (rank === 3) return "text-tier-bronze-from";
    return "text-text-tertiary";
  };

  return (
    <div className="space-y-4">
      <Card padding="lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-text-disabled">
                  <th className="pb-3 pl-4 pr-2 font-semibold">#</th>
                  <th className="pb-3 px-2 font-semibold">Entry</th>
                  <th className="pb-3 px-2 font-semibold text-right">Total</th>
                  <th className="hidden pb-3 px-2 font-semibold text-right sm:table-cell">Algorithm</th>
                  <th className="hidden pb-3 px-2 font-semibold text-right sm:table-cell">Community</th>
                  <th className="hidden pb-3 px-2 font-semibold text-right sm:table-cell">Judge</th>
                  <th className="w-10 pb-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ entry, rank, total, algorithm, community, judge }) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border-subtle/50 transition-colors last:border-0 hover:bg-bg-tertiary/50"
                  >
                    <td className="py-3 pl-4 pr-2">
                      <span
                        className={cn(
                          "font-numeric inline-flex items-center gap-1 font-semibold",
                          topThreeClass(rank)
                        )}
                      >
                        {rank <= 3 ? (
                          <Medal className="h-4 w-4" />
                        ) : null}
                        {rank}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-text-primary">
                          {entry.title}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {entry.author}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-numeric font-semibold text-text-primary">
                      {total}
                    </td>
                    <td className="hidden py-3 px-2 text-right font-numeric text-text-secondary sm:table-cell">
                      {algorithm}
                    </td>
                    <td className="hidden py-3 px-2 text-right font-numeric text-text-secondary sm:table-cell">
                      {community}
                    </td>
                    <td className="hidden py-3 px-2 text-right font-numeric text-text-secondary sm:table-cell">
                      {judge}
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={entry.workUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-text-tertiary hover:text-primary-400"
                        aria-label="Open entry"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
