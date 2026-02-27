import Link from "next/link";
import { Button } from "@/components/ui";

export default function StatusPlaceholder() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text-primary">System Status</h1>
      <p className="mt-2 text-sm text-text-secondary">Coming soon.</p>
      <Button className="mt-6" asChild><Link href="/">Back home</Link></Button>
    </div>
  );
}
