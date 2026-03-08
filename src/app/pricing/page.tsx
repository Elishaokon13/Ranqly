"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Calculator,
  Users,
  Trophy,
  Shield,
  Zap,
  Crown,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Button, Badge, Card, Separator, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: "$5K",
    description: "Perfect for your first campaign. Reward top 50 creators.",
    icon: Zap,
    color: "primary",
    popular: false,
    cta: "Get Started",
    features: {
      prizePool: "Up to $5,000",
      winners: "Top 50 rewarded",
      submissions: "Up to 500",
      judges: "Up to 3",
      phases: "All 6 phases",
      auditPack: true,
      customBranding: false,
      apiAccess: false,
      dedicatedSupport: false,
      analyticsDashboard: "Basic",
      disputeResolution: "Standard",
      customWeights: false,
    },
  },
  {
    name: "Growth",
    price: "$12K",
    description: "Scale your campaigns. Reward top 100-250 creators.",
    icon: Crown,
    color: "accent",
    popular: true,
    cta: "Get Started",
    features: {
      prizePool: "Up to $12,000",
      winners: "Top 100-250 rewarded",
      submissions: "Up to 2,000",
      judges: "Up to 7",
      phases: "All 6 phases",
      auditPack: true,
      customBranding: true,
      apiAccess: true,
      dedicatedSupport: false,
      analyticsDashboard: "Advanced",
      disputeResolution: "Priority",
      customWeights: true,
    },
  },
  {
    name: "Enterprise",
    price: "$25K+",
    description: "Full customization for large-scale campaigns.",
    icon: Building2,
    color: "warning",
    popular: false,
    cta: "Book a Demo",
    features: {
      prizePool: "Custom",
      winners: "Custom distribution",
      submissions: "Unlimited",
      judges: "Unlimited",
      phases: "All 6 phases + custom",
      auditPack: true,
      customBranding: true,
      apiAccess: true,
      dedicatedSupport: true,
      analyticsDashboard: "Full + custom reports",
      disputeResolution: "Dedicated team",
      customWeights: true,
    },
  },
];

const featureRows = [
  { key: "prizePool", label: "Prize Pool" },
  { key: "winners", label: "Winners Rewarded" },
  { key: "submissions", label: "Max Submissions" },
  { key: "judges", label: "Judges" },
  { key: "phases", label: "Campaign Phases" },
  { key: "analyticsDashboard", label: "Analytics Dashboard" },
  { key: "disputeResolution", label: "Dispute Resolution" },
  { key: "auditPack", label: "Audit Pack Download" },
  { key: "customBranding", label: "Custom Branding" },
  { key: "apiAccess", label: "API Access" },
  { key: "customWeights", label: "Custom Score Weights" },
  { key: "dedicatedSupport", label: "Dedicated Support" },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-success" />
    ) : (
      <X className="h-4 w-4 text-text-disabled" />
    );
  }
  return <span className="text-sm text-text-primary">{value}</span>;
}

export default function PricingPage() {
  const [participants, setParticipants] = useState(100);

  const estimatedCost = (() => {
    if (participants <= 50) return 5000;
    if (participants <= 250) return 5000 + (participants - 50) * 35;
    return 12000 + (participants - 250) * 52;
  })();

  const recommendedTier = (() => {
    if (participants <= 50) return "Starter";
    if (participants <= 250) return "Growth";
    return "Enterprise";
  })();

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
              For Organizers
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-text-primary font-display sm:text-5xl">
              Launch your{" "}
              <span className="bg-linear-to-r from-primary-400 via-primary-300 to-accent-500 bg-clip-text text-transparent">
                campaign
              </span>{" "}
              today
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
              Simple, transparent pricing. Choose the plan that fits your campaign
              size and scale as you grow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              {...fadeIn}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  <Badge variant="success" size="sm">
                    <Trophy className="h-3 w-3" /> Most Popular
                  </Badge>
                </div>
              )}
              <Card
                padding="lg"
                className={cn(
                  "h-full flex flex-col",
                  tier.popular && "border-primary-500/50 shadow-glow-primary"
                )}
              >
                <div className="mb-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary">
                    <tier.icon className={cn("h-5 w-5", {
                      "text-primary-400": tier.color === "primary",
                      "text-accent-400": tier.color === "accent",
                      "text-warning": tier.color === "warning",
                    })} />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary font-display">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-sm text-text-tertiary">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-text-primary font-display">
                    {tier.price}
                  </span>
                  <span className="ml-1 text-sm text-text-tertiary">
                    / campaign
                  </span>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {[
                    tier.features.prizePool,
                    tier.features.winners,
                    `${tier.features.submissions} submissions`,
                    `${tier.features.judges} judges`,
                    tier.features.analyticsDashboard + " analytics",
                    tier.features.auditPack && "Audit pack included",
                    tier.features.customBranding && "Custom branding",
                    tier.features.apiAccess && "API access",
                    tier.features.dedicatedSupport && "Dedicated support",
                  ]
                    .filter(Boolean)
                    .map((feature) => (
                      <li
                        key={String(feature)}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {String(feature)}
                      </li>
                    ))}
                </ul>

                <Button
                  variant={tier.popular ? "primary" : "secondary"}
                  className="w-full"
                  asChild
                >
                  <Link href={tier.name === "Enterprise" ? "/contact" : "/explore"}>
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-t border-border-subtle bg-bg-secondary/50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...fadeIn} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-bold text-text-primary font-display">
              Compare plans
            </h2>
            <p className="mt-3 text-text-secondary">
              See exactly what&apos;s included in each tier.
            </p>
          </motion.div>

          <motion.div
            className="overflow-x-auto"
            {...fadeIn}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="pb-4 text-left text-sm font-medium text-text-tertiary">
                    Feature
                  </th>
                  {tiers.map((tier) => (
                    <th
                      key={tier.name}
                      className="pb-4 text-center text-sm font-semibold text-text-primary"
                    >
                      <div className="flex flex-col items-center gap-1">
                        {tier.name}
                        {tier.popular && (
                          <Badge variant="success" size="sm">Popular</Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-border-subtle/50"
                  >
                    <td className="py-3.5 text-sm text-text-secondary">
                      {row.label}
                    </td>
                    {tiers.map((tier) => (
                      <td key={tier.name} className="py-3.5 text-center">
                        <div className="flex justify-center">
                          <FeatureValue
                            value={
                              tier.features[
                                row.key as keyof typeof tier.features
                              ]
                            }
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Calculator */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-10" {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="default" size="md" className="mb-4">
              <Calculator className="h-3 w-3" /> Calculator
            </Badge>
            <h2 className="text-3xl font-bold text-text-primary font-display">
              Estimate your cost
            </h2>
            <p className="mt-3 text-text-secondary">
              Enter the number of participants you expect.
            </p>
          </motion.div>

          <motion.div {...fadeIn} transition={{ duration: 0.6, delay: 0.2 }}>
            <Card padding="lg">
              <div className="flex flex-col items-center gap-6">
                <div className="w-full max-w-xs">
                  <label
                    htmlFor="participants"
                    className="mb-2 block text-center text-sm font-medium text-text-primary"
                  >
                    Expected Participants
                  </label>
                  <input
                    id="participants"
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={participants}
                    onChange={(e) => setParticipants(Number(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                  <div className="mt-2 flex justify-between text-xs text-text-tertiary">
                    <span>10</span>
                    <span className="text-lg font-bold text-text-primary font-display">
                      {participants}
                    </span>
                    <span>1,000</span>
                  </div>
                </div>

                <Separator />

                <div className="text-center">
                  <p className="text-sm text-text-tertiary mb-1">Estimated Cost</p>
                  <p className="text-4xl font-extrabold text-text-primary font-display">
                    ${estimatedCost.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-text-tertiary" />
                  <p className="text-sm text-text-secondary">
                    Recommended plan:{" "}
                    <span className="font-semibold text-primary-400">
                      {recommendedTier}
                    </span>
                  </p>
                </div>

                <div className="grid w-full grid-cols-3 gap-2 text-center">
                  {[
                    {
                      label: "Per Creator",
                      value: `$${(estimatedCost / participants).toFixed(0)}`,
                    },
                    {
                      label: "Top 10 Share",
                      value: `$${Math.round(estimatedCost * 0.015 * 10).toLocaleString()}`,
                    },
                    {
                      label: "Top 100 Share",
                      value: `$${Math.round(estimatedCost * 0.005 * 100).toLocaleString()}`,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl bg-bg-tertiary p-3"
                    >
                      <p className="text-xs text-text-tertiary">{stat.label}</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <Button className="w-full" asChild>
                  <Link href="/explore">
                    {recommendedTier === "Enterprise"
                      ? "Book a Demo"
                      : "Launch Your Campaign"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ mini */}
      <section className="border-t border-border-subtle bg-bg-secondary/50">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <motion.div {...fadeIn} transition={{ duration: 0.6 }}>
            <h2 className="text-2xl font-bold text-text-primary font-display">
              Questions about pricing?
            </h2>
            <p className="mt-3 text-text-secondary">
              We&apos;re happy to help you find the right plan for your needs.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/about#contact">
                  Contact Sales
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/how-it-works#faq">View FAQ</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
