import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-numeric text-6xl font-bold text-text-disabled">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-text-primary">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/explore">Explore contests</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/help">Help</Link>
        </Button>
      </div>
    </div>
  );
}
