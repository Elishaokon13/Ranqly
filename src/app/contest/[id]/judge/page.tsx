import { notFound } from "next/navigation";
import Link from "next/link";
import { MOCK_CONTESTS, getEntriesByContestId } from "@/lib/mock-data";
import { JudgingPanel } from "./JudgingPanel";
import { Button } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ArrowLeft } from "lucide-react";

const JUDGING_PHASES = ["judging", "finalization"] as const;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JudgeContestPage({ params }: PageProps) {
  const { id } = await params;
  const contest = MOCK_CONTESTS.find((c) => c.id === id);
  const entries = contest ? getEntriesByContestId(contest.id) : [];

  if (
    !contest ||
    !JUDGING_PHASES.includes(contest.phase as (typeof JUDGING_PHASES)[number])
  ) {
    notFound();
  }

  return (
    <RequireAuth message="Sign in to judge contest entries.">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link href={`/contest/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to contest
          </Link>
        </Button>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Judge entries
          </h1>
          <p className="mt-1 text-text-secondary">
            {contest.title} · {contest.organizer.name}
          </p>
        </div>
        <JudgingPanel contestId={contest.id} contestTitle={contest.title} entries={entries} />
      </div>
    </RequireAuth>
  );
}
