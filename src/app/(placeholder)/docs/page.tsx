import Link from "next/link";
import { Button } from "@/components/ui";

export default function DocsPlaceholder() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text-primary">Documentation</h1>
      <p className="mt-2 text-sm text-text-secondary">Coming soon.</p>
      <Button className="mt-6" asChild><Link href="/help">Help Center</Link></Button>
    </div>
  );
}
