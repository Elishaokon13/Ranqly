import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchContest, fetchContestSubmissions } from "@/lib/api";
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
  const contest = await fetchContest(id);
  const entries = contest ? await fetchContestSubmissions(contest.id, { limit: 200 }) : [];

  if (
    !contest ||
    !JUDGING_PHASES.includes(contest.phase as (typeof JUDGING_PHASES)[number])
  ) {
    notFound();
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
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
