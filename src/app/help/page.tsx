"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  BookOpen,
  Compass,
  FileText,
  MessageCircle,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How do I submit an entry to a contest?",
    a: "Go to the contest page and click 'Submit entry' in the sidebar (when submissions are open). You'll need to provide a title, link to your work, and a short description. Make sure you accept the contest rules before submitting.",
  },
  {
    q: "How does voting work?",
    a: "You need a Proof-of-Impact (PoI) NFT to vote. Mint one from the voting panel on any contest in the voting phase. Each voter gets 5 upvotes and 2 downvotes per contest. Votes are commit-reveal and require a short justification.",
  },
  {
    q: "How are winners determined?",
    a: "Final scores combine three pillars: 40% algorithmic score (depth, reach, relevance, consistency), 30% community votes from PoI holders, and 30% expert judge scores. Winners are announced after the finalization phase.",
  },
  {
    q: "How do I become a judge?",
    a: "Judges are selected by contest organizers. If you're assigned, you'll see the contest under Judge dashboard. Score each entry from 0–100 and submit before the deadline.",
  },
  {
    q: "What if I want to dispute an entry or nomination?",
    a: "During the disputes phase, you can file a dispute with evidence (e.g. plagiarism, rule violations) or nominate an underrated entry. Go to the contest page and use the Disputes tab or the 'File dispute' option.",
  },
  {
    q: "Where can I see my submissions and results?",
    a: "My submissions lists all your entries across contests. From there you can view each submission, edit or withdraw (when the phase allows), and see your rank once results are published.",
  },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-400 mb-4">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Help Center
        </h1>
        <p className="mt-2 text-text-secondary">
          Find answers and get in touch.
        </p>
      </motion.div>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">
          Frequently asked questions
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className={cn(
                  "flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors",
                  openFaq === i
                    ? "border-primary-500/30 bg-primary-500/5"
                    : "border-border-subtle bg-bg-secondary hover:border-border-medium"
                )}
              >
                <span className="text-sm font-medium text-text-primary">
                  {faq.q}
                </span>
                <ChevronDown
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 text-text-tertiary transition-transform",
                    openFaq === i && "rotate-180"
                  )}
                />
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-x border-b border-border-subtle rounded-b-xl bg-bg-secondary/50 px-4 py-3 text-sm leading-relaxed text-text-secondary">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">
          Quick links
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/how-it-works">
            <Card padding="md" hoverable className="h-full">
              <CardContent className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary-400" />
                <span className="font-medium text-text-primary">How it works</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/explore">
            <Card padding="md" hoverable className="h-full">
              <CardContent className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-primary-400" />
                <span className="font-medium text-text-primary">Explore contests</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/submissions">
            <Card padding="md" hoverable className="h-full">
              <CardContent className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary-400" />
                <span className="font-medium text-text-primary">My submissions</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/disputes">
            <Card padding="md" hoverable className="h-full">
              <CardContent className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary-400" />
                <span className="font-medium text-text-primary">Disputes</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      <Card padding="lg">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary">
              <Mail className="h-5 w-5 text-text-secondary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Contact support</p>
              <p className="text-sm text-text-tertiary">
                support@ranqly.xyz — we typically respond within 24–48 hours.
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <a href="mailto:support@ranqly.xyz">Email us</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
