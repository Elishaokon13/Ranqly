import Link from "next/link";
import { Button } from "@/components/ui";

export default function ContestNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text-primary">
        Contest not found
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        This contest may have been removed or the link is incorrect.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/explore">Browse contests</Link>
      </Button>
    </div>
  );
}
