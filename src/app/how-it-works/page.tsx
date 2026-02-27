"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Cpu,
  AlertTriangle,
  Vote,
  Scale,
  Trophy,
  PenTool,
  Users,
  Gavel,
  Building2,
  BarChart3,
  Heart,
  Shield,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button, Badge, Card, Progress, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

const phases = [
  {
    id: "A",
    title: "Submission",
    duration: "T-0 to deadline",
    icon: Upload,
    color: "text-primary-400",
    bgColor: "bg-primary-500/15",
    description:
      "Creators submit their content entries — articles, videos, tutorials, designs — by linking their work and signing with their wallet.",
    details: [
      "Submit title, URL, category, and description",
      "On-chain signature locks entry immutably",
      "Edit or withdraw until deadline",
      "No scores visible during this phase",
    ],
  },
  {
    id: "B",
    title: "Algorithmic Scoring",
    duration: "≤ 24 hours",
    icon: Cpu,
    color: "text-accent-400",
    bgColor: "bg-accent-500/15",
    description:
      "Our algorithm analyzes every entry across four dimensions: depth, reach, relevance, and consistency. Scores are deterministic and reproducible.",
    details: [
      "Automated analysis of content quality",
      "Scores: Depth, Reach, Relevance, Consistency",
      "Top 25 preview appears as scores complete",
      "Algorithm is open-source and auditable",
    ],
  },
  {
    id: "C",
    title: "Disputes & Nominations",
    duration: "24 hours",
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/15",
    description:
      "A 24-hour window for the community to flag issues (plagiarism, rule violations) or nominate underrated content for bonus points.",
    details: [
      "File disputes with evidence required",
      "Nominate hidden gems for +10 bonus points",
      "Disputes reviewed by triage team",
      "False disputes affect your reputation",
    ],
  },
  {
    id: "D",
    title: "Community Voting",
    duration: "48 hours",
    icon: Vote,
    color: "text-primary-300",
    bgColor: "bg-primary-300/15",
    description:
      "PoI NFT holders vote on entries with written justifications. Each voter gets 5 upvotes and 2 downvotes. Votes are commit-reveal encrypted.",
    details: [
      "Requires Proof-of-Impact NFT ($0.70)",
      "5 upvotes + 2 downvotes per voter",
      "Written justification required for each vote",
      "Votes encrypted until phase ends (commit-reveal)",
    ],
  },
  {
    id: "E",
    title: "Expert Judging",
    duration: "≤ 48 hours",
    icon: Scale,
    color: "text-tier-platinum-from",
    bgColor: "bg-primary-200/10",
    description:
      "An anonymous panel of domain experts independently reviews and ranks all entries. Each judge provides scores and written rationale.",
    details: [
      "Anonymous panel of 5-10 experts",
      "Rate: Quality, Originality, Clarity, Depth",
      "Written rationale required (50+ chars)",
      "Final drag-and-drop ranking of all entries",
    ],
  },
  {
    id: "F",
    title: "Finalization",
    duration: "≤ 12 hours",
    icon: Trophy,
    color: "text-warning",
    bgColor: "bg-warning/15",
    description:
      "Final scores are computed by combining algorithmic (40%), community (30%), and judge (30%) scores. Winners are announced and rewards distributed.",
    details: [
      "Weighted score: 40% Algo + 30% Community + 30% Judges",
      "Tier assignment: Diamond → Bronze",
      "Rewards distributed automatically",
      "Full audit pack available for download",
    ],
  },
];

const roles = [
  {
    icon: PenTool,
    title: "Creator",
    color: "from-primary-400 to-primary-600",
    description: "Submit your best content to contests and earn based on quality.",
    actions: ["Submit entries to contests", "Track scores and rankings", "Earn rewards from prize pools", "Build a creator reputation"],
  },
  {
    icon: Users,
    title: "Voter",
    color: "from-accent-500 to-accent-700",
    description: "Hold a PoI NFT and shape outcomes by voting with justifications.",
    actions: ["Mint PoI NFT for $0.70 (one-time)", "Vote on entries with reasons", "Earn accuracy rewards", "Build voter reputation"],
  },
  {
    icon: Gavel,
    title: "Judge",
    color: "from-primary-300 to-accent-400",
    description: "Domain experts who independently evaluate and rank entries.",
    actions: ["Review all assigned entries", "Score quality, originality, clarity, depth", "Submit written rationale", "Rank entries via drag-and-drop"],
  },
  {
    icon: Building2,
    title: "Organizer",
    color: "from-warning to-error",
    description: "Projects that launch and fund contests to discover great content.",
    actions: ["Create and configure contests", "Set prize pools and rules", "Assign judges", "Monitor contest analytics"],
  },
];

const scoringPillars = [
  {
    pct: 40,
    label: "Algorithmic Score",
    icon: Cpu,
    color: "primary" as const,
    sub: [
      { label: "Depth", desc: "How thorough and detailed is the content?" },
      { label: "Reach", desc: "How well does it engage the target audience?" },
      { label: "Relevance", desc: "How closely does it match the contest brief?" },
      { label: "Consistency", desc: "Is the quality uniform throughout?" },
    ],
  },
  {
    pct: 30,
    label: "Community Vote",
    icon: Heart,
    color: "success" as const,
    sub: [
      { label: "Upvotes", desc: "Positive signals from PoI NFT holders" },
      { label: "Downvotes", desc: "Negative signals with required justification" },
      { label: "Justifications", desc: "Written reasoning for each vote" },
      { label: "Net Score", desc: "Normalized upvotes minus downvotes" },
    ],
  },
  {
    pct: 30,
    label: "Expert Judges",
    icon: Scale,
    color: "warning" as const,
    sub: [
      { label: "Quality", desc: "Overall production quality assessment" },
      { label: "Originality", desc: "Uniqueness and novel insights" },
      { label: "Clarity", desc: "How clear and well-presented" },
      { label: "Rankings", desc: "Borda count from judge orderings" },
    ],
  },
];

const faqs = [
  {
    q: "How much does it cost to enter a contest?",
    a: "Entering a contest requires a small gas fee (~$0.50) to sign your entry on-chain. There is no entry fee — contests are free to enter for creators.",
  },
  {
    q: "What is the Proof-of-Impact (PoI) NFT?",
    a: "The PoI NFT is a soulbound (non-transferable) NFT that costs $0.70 USDC to mint. It grants voting rights in all Ranqly contests forever. One wallet can only hold one PoI NFT, preventing sybil attacks.",
  },
  {
    q: "How are winners paid out?",
    a: "Prize pools are distributed automatically via smart contracts after the finalization phase. Top creators receive their share based on their final ranking and the prize distribution formula (typically arithmetic split).",
  },
  {
    q: "Can I edit or withdraw my entry after submitting?",
    a: "Yes — you can edit or withdraw your entry at any time during the Submission phase (Phase A). Once the submission deadline passes, entries are locked. Withdrawals are permanent and the entry won't be eligible for rewards.",
  },
  {
    q: "How do you prevent plagiarism and cheating?",
    a: "Our algorithm includes similarity detection that flags entries above 80% match with existing content. The community can also file disputes during Phase C with evidence. Validated plagiarism results in score penalties or disqualification.",
  },
  {
    q: "Is the scoring algorithm open source?",
    a: "Yes — the scoring algorithm is fully open source and auditable. Every contest also produces an audit pack that includes all raw scores, votes, judge ballots, and verification hashes stored on IPFS.",
  },
  {
    q: "How are judges selected?",
    a: "Contest organizers invite judges from a pool of verified domain experts, or they can invite specific individuals via email. Judges review entries anonymously and independently to minimize bias.",
  },
  {
    q: "What types of content can I submit?",
    a: "Contests support various content types: articles, Twitter threads, videos, tutorials, designs, code, research papers, and more. Each contest specifies which content types are accepted in its rules.",
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function HowItWorksPage() {
  const [activePhase, setActivePhase] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <motion.div {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="primary" size="lg" className="mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Contest Lifecycle
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-text-primary font-display sm:text-5xl">
              How{" "}
              <span className="bg-linear-to-r from-primary-400 via-primary-300 to-accent-500 bg-clip-text text-transparent">
                Ranqly
              </span>{" "}
              works
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
              Every contest follows a structured six-phase lifecycle designed for
              maximum fairness and transparency.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contest Lifecycle Timeline */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" {...fadeIn} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl font-bold text-text-primary font-display">
            The six phases
          </h2>
          <p className="mt-3 text-text-secondary">
            Click a phase to learn more about what happens at each stage.
          </p>
        </motion.div>

        {/* Phase selector */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {phases.map((phase, i) => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(i)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                activePhase === i
                  ? "bg-primary-500 text-white shadow-glow-primary"
                  : "bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <span className="text-xs font-bold opacity-60">Phase {phase.id}</span>
              {phase.title}
            </button>
          ))}
        </div>

        {/* Active phase detail */}
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card padding="lg" className="mx-auto max-w-2xl">
            <div className="flex items-start gap-4">
              <div className={cn("shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl", phases[activePhase].bgColor)}>
                {(() => {
                  const Icon = phases[activePhase].icon;
                  return <Icon className={cn("h-6 w-6", phases[activePhase].color)} />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="primary" size="sm">Phase {phases[activePhase].id}</Badge>
                  <span className="text-xs text-text-tertiary">{phases[activePhase].duration}</span>
                </div>
                <h3 className="text-xl font-semibold text-text-primary font-display">
                  {phases[activePhase].title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {phases[activePhase].description}
                </p>
              </div>
            </div>

            <Separator className="my-5" />

            <ul className="space-y-2">
              {phases[activePhase].details.map((detail) => (
                <li key={detail} className="flex items-start gap-2.5 text-sm text-text-tertiary">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                  {detail}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Progress indicator */}
        <div className="mt-8 mx-auto max-w-2xl">
          <Progress
            value={((activePhase + 1) / phases.length) * 100}
            showValue
            label={`Phase ${phases[activePhase].id} of ${phases.length}`}
            size="sm"
          />
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-border-subtle bg-bg-secondary/50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="default" size="md" className="mb-4">Roles</Badge>
            <h2 className="text-3xl font-bold text-text-primary font-display">
              Four roles, one fair system
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Every participant plays a crucial role in maintaining fairness.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((role, i) => (
              <motion.div key={role.title} {...fadeIn} transition={{ delay: i * 0.1 }}>
                <Card padding="lg" className="h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", role.color)}>
                      <role.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-text-primary font-display">
                        {role.title}
                      </h3>
                      <p className="text-xs text-text-tertiary">{role.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {role.actions.map((action) => (
                      <li key={action} className="flex items-start gap-2 text-sm text-text-secondary">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500/60" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring Breakdown */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="default" size="md" className="mb-4">
              <BarChart3 className="h-3 w-3" /> Scoring
            </Badge>
            <h2 className="text-3xl font-bold text-text-primary font-display">
              How winners are determined
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Three independent scoring pillars are combined to produce a fair final ranking.
            </p>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {scoringPillars.map((pillar, i) => (
              <motion.div key={pillar.label} {...fadeIn} transition={{ delay: i * 0.15 }}>
                <Card padding="lg" className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary">
                      <pillar.icon className="h-5 w-5 text-text-secondary" />
                    </div>
                    <span className="text-3xl font-extrabold text-text-primary font-display">
                      {pillar.pct}%
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-text-primary font-display mb-1">
                    {pillar.label}
                  </h3>
                  <Progress value={pillar.pct} max={100} variant={pillar.color} size="sm" className="mb-4" />
                  <ul className="space-y-3">
                    {pillar.sub.map((s) => (
                      <li key={s.label}>
                        <p className="text-sm font-medium text-text-primary">{s.label}</p>
                        <p className="text-xs text-text-tertiary">{s.desc}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Badge variant="success" size="lg">
              <Shield className="h-3.5 w-3.5" />
              All scores verifiable on-chain — Download audit packs post-contest
            </Badge>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border-subtle bg-bg-secondary/50">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="default" size="md" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold text-text-primary font-display">
              Frequently asked questions
            </h2>
          </motion.div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={cn(
                    "flex w-full items-start justify-between gap-4 rounded-xl border px-5 py-4 text-left transition-colors",
                    openFaq === i
                      ? "border-primary-500/30 bg-bg-secondary"
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
                    <div className="px-5 py-3 text-sm leading-relaxed text-text-secondary">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <motion.div {...fadeIn} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl font-bold text-text-primary font-display">
              Ready to participate?
            </h2>
            <p className="mt-3 text-text-secondary">
              Join thousands of creators already competing fairly on Ranqly.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/explore">
                  Explore Contests
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/waitlist">Join Waitlist</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
