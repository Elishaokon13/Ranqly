import Link from "next/link";
import { Button } from "@/components/ui";

export default function PrivacyPage() {
  const sections = [
    { title: "1. Information we collect", content: "We collect information you provide (email, wallet address, profile data), usage data, and contest-related activity. We do not sell your personal data." },
    { title: "2. How we use it", content: "We use your information to operate the platform, process contests, communicate with you, and improve our services." },
    { title: "3. Sharing", content: "We may share data with contest organizers (as needed for judging), service providers, and when required by law." },
    { title: "4. Security", content: "We use industry-standard measures to protect your data. Wallet and on-chain activity are subject to blockchain transparency." },
    { title: "5. Your rights", content: "You may access, correct, or delete your data where applicable. Contact us for requests." },
  ];

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-text-primary">Privacy Policy</h1>
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
