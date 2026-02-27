import Link from "next/link";
import { Button } from "@/components/ui";

export default function CategoryNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text-primary">
        Category not found
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Valid categories are Content, Design, Development, Research, and Other.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/explore">Browse all contests</Link>
      </Button>
    </div>
  );
}
