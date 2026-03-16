import Link from "next/link";
import { Button } from "@/components/ui";

export default function TermsPage() {
  const sections = [
    { title: "1. Acceptance of terms", content: "By accessing or using Ranqly, you agree to be bound by these Terms of Service and our Privacy Policy." },
    { title: "2. Description of service", content: "Ranqly provides a platform for running content contests, including submission, voting, judging, and prize distribution. Services may be updated or modified from time to time." },
    { title: "3. Eligibility", content: "You must be at least 18 years old and able to form a binding contract. You are responsible for compliance with local laws." },
    { title: "4. User conduct", content: "You agree not to submit false or misleading content, violate intellectual property rights, or use the service for illegal purposes." },
    { title: "5. Prizes and payments", content: "Prize distribution is subject to contest rules and smart contract execution. Ranqly is not responsible for tax implications." },
    { title: "6. Limitation of liability", content: "Ranqly is provided \"as is.\" We disclaim warranties and limit liability to the extent permitted by law." },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">Terms of Service</h1>
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
