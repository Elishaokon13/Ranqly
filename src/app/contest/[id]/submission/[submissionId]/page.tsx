import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchContest, fetchSubmissionDetail, mapSubmissionDetailToMySubmission } from "@/lib/api";
import { SubmissionDetailContent } from "./SubmissionDetailContent";
import { Button } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string; submissionId: string }>;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id: contestId, submissionId } = await params;
  const contest = await fetchContest(contestId);
  const raw = await fetchSubmissionDetail(contestId, submissionId);
  if (!contest || !raw) notFound();
  const submission = mapSubmissionDetailToMySubmission(raw);

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/contest/${contestId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Contest
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/submissions">My submissions</Link>
        </Button>
      </div>

      <SubmissionDetailContent contest={contest} submission={submission} />
    </div>
  );
}
