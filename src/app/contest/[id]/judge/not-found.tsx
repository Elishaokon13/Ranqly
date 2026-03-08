import Link from "next/link";
import { Button } from "@/components/ui";

export default function JudgeContestNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text-primary">
        Contest not available for judging
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        This contest is not in the judging phase or does not exist.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/judge">Judge dashboard</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/explore">Explore contests</Link>
        </Button>
      </div>
    </div>
  );
}
