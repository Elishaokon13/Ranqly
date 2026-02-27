import Link from "next/link";
import { Button } from "@/components/ui";

export default function TermsPlaceholder() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text-primary">Terms of Service</h1>
      <p className="mt-2 text-sm text-text-secondary">Coming soon.</p>
      <Button className="mt-6" asChild><Link href="/">Back home</Link></Button>
    </div>
  );
}
