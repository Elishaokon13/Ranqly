"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  FileCheck,
  Lock,
  Database,
  Download,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";

const sections = [
  {
    icon: FileCheck,
    title: "Audit packs",
    description:
      "After each contest ends, a full audit pack is published. It includes every raw score (algorithmic, community, judge), vote receipts, judge ballots, and verification hashes. Audit packs are stored on IPFS and referenced on-chain so anyone can verify the final ranking.",
  },
  {
    icon: Lock,
    title: "On-chain verification",
    description:
      "Critical data is committed on-chain: submission hashes, vote commitments (commit-reveal), and final score Merkle roots. This ensures that results cannot be altered after the fact and that the community can independently verify fairness.",
  },
  {
    icon: Database,
    title: "Open scoring algorithm",
    description:
      "The algorithmic scoring component is open source. You can inspect how depth, reach, relevance, and consistency are computed. Reproducibility is a core design goal — same inputs produce the same scores.",
  },
  {
    icon: Eye,
    title: "Transparent phases",
    description:
      "Each contest moves through fixed phases (submission → scoring → disputes → voting → judging → finalization). Timestamps and phase transitions are visible. Disputes and nominations are logged and reviewed by the triage team.",
  },
];

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-400 mb-6">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Transparency & audit
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-text-secondary">
          Ranqly is built so that every score, vote, and outcome can be verified.
          No black boxes — audit packs, on-chain commits, and open-source scoring.
        </p>
      </motion.div>

      <div className="space-y-6">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Card padding="lg">
                <CardContent className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-tertiary text-primary-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-text-primary">
                      {section.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {section.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="mt-12 rounded-2xl border border-primary-500/30 bg-primary-500/10 p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-text-primary">
              Download audit packs
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Completed contests publish audit packs for public verification.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="shrink-0" asChild>
            <Link href="/explore">
              <Download className="mr-2 h-4 w-4" />
              Find completed contests
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>

      <p className="mt-8 text-center text-xs text-text-disabled">
        Questions? See our{" "}
        <Link href="/help" className="text-primary-400 hover:underline">
          Help Center
        </Link>{" "}
        or{" "}
        <Link href="/how-it-works" className="text-primary-400 hover:underline">
          How it works
        </Link>
        .
      </p>
    </div>
  );
}
