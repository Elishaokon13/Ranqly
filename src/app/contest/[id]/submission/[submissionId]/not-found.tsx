import Link from "next/link";
import { Button } from "@/components/ui";

export default function SubmissionNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text-primary">
        Submission not found
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        This submission may not exist or you may not have access to it.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/submissions">My submissions</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/explore">Explore contests</Link>
        </Button>
      </div>
    </div>
  );
}
