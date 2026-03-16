import Link from "next/link";
import { Button } from "@/components/ui";

export default function CookiesPage() {
  const sections = [
    { title: "What we use", content: "We use essential cookies to keep you signed in and remember your preferences. We may use analytics cookies to improve the product." },
    { title: "Managing cookies", content: "You can control cookies through your browser settings. Disabling some cookies may affect how the site works." },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">Cookie Policy</h1>
        <p className="mt-2 text-sm text-text-tertiary">Last updated: February 2026</p>
      </div>
      <div className="prose prose-invert max-w-none space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-lg font-semibold text-text-primary">{s.title}</h2>
            <p className="mt-2 text-text-secondary">{s.content}</p>
          </section>
        ))}
      </div>
      <p className="mt-10">
        <Button variant="ghost" asChild><Link href="/">Back home</Link></Button>
      </p>
    </div>
  );
}
