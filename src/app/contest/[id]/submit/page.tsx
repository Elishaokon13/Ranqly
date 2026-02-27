import { notFound } from "next/navigation";
import Link from "next/link";
import { MOCK_CONTESTS } from "@/lib/mock-data";
import { SubmitEntryForm } from "./SubmitEntryForm";
import { Button } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmitEntryPage({ params }: PageProps) {
  const { id } = await params;
  const contest = MOCK_CONTESTS.find((c) => c.id === id);
  if (!contest) notFound();

  return (
    <RequireAuth message="Sign in to submit an entry to this contest.">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link href={`/contest/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to contest
          </Link>
        </Button>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Submit entry
          </h1>
          <p className="mt-1 text-text-secondary">
            {contest.title} · {contest.organizer.name}
          </p>
        </div>
        <SubmitEntryForm contest={contest} />
      </div>
    </RequireAuth>
  );
}
