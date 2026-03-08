"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  BarChart3,
  Users,
  Zap,
  CheckCircle2,
  ArrowRight,
  Twitter,
  Github,
  MessageCircle,
} from "lucide-react";
import { Button, Input, AvatarStack, Badge } from "@/components/ui";

type FormState = "idle" | "loading" | "success" | "error";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address");
      setFormState("error");
      return;
    }

    setFormState("loading");
    setErrorMsg("");

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setFormState("success");

    // Auto-reset after 3s
    setTimeout(() => {
      setFormState("idle");
      setEmail("");
    }, 3000);
  };

  return (
    <div className="relative min-h-[calc(100vh-var(--navbar-height))] overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary-500/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-accent-500/10 blur-[100px]" />
        <div className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary-700/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        {/* Hero */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="primary" size="lg" className="mb-6">
            <Zap className="h-3.5 w-3.5" />
            Early Access — Limited Spots
          </Badge>

          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-text-primary font-display sm:text-5xl lg:text-6xl">
            The Fair Content Layer{" "}
            <span className="bg-gradient-to-r from-primary-400 to-accent-500 bg-clip-text text-transparent">
              for Web3
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            Transparent algorithmic scoring, community voting, and expert
            judging — all verifiable on-chain. Join the waitlist to be first in
            line.
          </p>
        </motion.div>

        {/* Email Form */}
        <motion.div
          className="mx-auto mt-10 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {formState === "success" ? (
            <motion.div
              className="flex flex-col items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-6 text-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="text-lg font-semibold text-text-primary">
                You&apos;re on the list!
              </p>
              <p className="text-sm text-text-secondary">
                We&apos;ll notify you when Ranqly launches.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input
                  id="waitlist-email"
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formState === "error") setFormState("idle");
                  }}
                  error={formState === "error" ? errorMsg : undefined}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  loading={formState === "loading"}
                  className="shrink-0"
                >
                  {formState === "loading" ? "Joining..." : "Join Waitlist"}
                  {formState === "idle" && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-center text-xs text-text-disabled">
                No spam, ever. Unsubscribe anytime.
              </p>
            </form>
          )}
        </motion.div>

        {/* Social Proof */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AvatarStack
            avatars={[
              { alt: "Alice" },
              { alt: "Bob" },
              { alt: "Carol" },
              { alt: "Dave" },
              { alt: "Eve" },
            ]}
            max={5}
            size="sm"
          />
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">2,847+</span>{" "}
            creators already on the waitlist
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="mt-20 grid gap-4 sm:grid-cols-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {[
            {
              icon: Shield,
              title: "100% Fair Scoring",
              description:
                "Triple-layered evaluation: algorithmic analysis, community voting, and expert judging — all auditable.",
            },
            {
              icon: BarChart3,
              title: "Transparent Rankings",
              description:
                "Every score is verifiable on-chain. Download full audit packs for any contest.",
            },
            {
              icon: Users,
              title: "Community-Driven",
              description:
                "Proof-of-Impact NFT holders vote with justifications. Sybil-resistant, one wallet one vote.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border-subtle bg-bg-secondary/50 p-6 backdrop-blur-sm transition-all hover:border-border-medium hover:bg-bg-secondary"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15">
                <feature.icon className="h-5 w-5 text-primary-400" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-text-primary font-display">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-tertiary">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Social Links */}
        <motion.div
          className="mt-16 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-sm text-text-disabled">Follow us for updates</p>
          <div className="flex gap-3">
            {[
              { icon: Twitter, href: "https://twitter.com/ranqly", label: "Twitter" },
              { icon: Github, href: "https://github.com/ranqly", label: "GitHub" },
              { icon: MessageCircle, href: "https://discord.gg/ranqly", label: "Discord" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-bg-tertiary text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
