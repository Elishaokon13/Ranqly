"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Target,
  Heart,
  Globe,
  CheckCircle2,
  Mail,
  Linkedin,
  Twitter,
  Github,
  ArrowRight,
  Newspaper,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Avatar,
  Card,
  Separator,
} from "@/components/ui";

const team = [
  {
    name: "Alex Chen",
    role: "Co-Founder & CEO",
    bio: "Previously lead engineer at Uniswap. Passionate about fair creator economies.",
    avatar: "AC",
  },
  {
    name: "Sarah Kim",
    role: "Co-Founder & CTO",
    bio: "PhD in mechanism design from MIT. Built ranking systems at Google.",
    avatar: "SK",
  },
  {
    name: "Marcus Rivera",
    role: "Head of Product",
    bio: "Former product lead at Mirror.xyz. 10+ years in creator tools.",
    avatar: "MR",
  },
  {
    name: "Priya Patel",
    role: "Head of Community",
    bio: "Community builder at Gitcoin Grants. Web3 native since 2017.",
    avatar: "PP",
  },
  {
    name: "David Osei",
    role: "Lead Engineer",
    bio: "Full-stack engineer. Previously at Aave and Chainlink.",
    avatar: "DO",
  },
  {
    name: "Lena Müller",
    role: "Head of Design",
    bio: "Design lead at Figma. Specializes in accessible design systems.",
    avatar: "LM",
  },
];

const roadmap = [
  {
    quarter: "Q1 2026",
    title: "Foundation",
    status: "completed" as const,
    items: [
      "Core scoring algorithm v1",
      "Platform beta launch",
      "First 10 contests live",
      "PoI NFT minting goes live",
    ],
  },
  {
    quarter: "Q2 2026",
    title: "Growth",
    status: "current" as const,
    items: [
      "Community voting system",
      "Expert judging panel",
      "Audit pack downloads",
      "Mobile-optimized experience",
    ],
  },
  {
    quarter: "Q3 2026",
    title: "Scale",
    status: "upcoming" as const,
    items: [
      "Cross-chain support",
      "API for organizers",
      "Advanced analytics dashboard",
      "Creator reputation system",
    ],
  },
  {
    quarter: "Q4 2026",
    title: "Decentralize",
    status: "upcoming" as const,
    items: [
      "DAO governance launch",
      "Open-source scoring algorithm",
      "Protocol fee sharing",
      "Community-run contests",
    ],
  },
];

const press = [
  { name: "CoinDesk", quote: "A fresh take on content quality in Web3" },
  { name: "The Block", quote: "Ranqly's triple-scoring model could redefine creator rewards" },
  { name: "Decrypt", quote: "Finally, a platform where content quality actually matters" },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function AboutPage() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setContactName("");
    setContactEmail("");
    setContactMessage("");
  };

  return (
    <div>
      {/* Hero / Mission */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-1/2 left-1/3 h-[600px] w-[600px] rounded-full bg-primary-500/10 blur-[120px]" />
          <div className="absolute -bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-accent-500/8 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <motion.div {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="primary" size="lg" className="mb-6">
              Our Mission
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-text-primary font-display sm:text-5xl">
              Making content{" "}
              <span className="bg-gradient-to-r from-primary-400 to-accent-500 bg-clip-text text-transparent">
                rewards fair
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
              We believe every creator deserves to be judged on the quality of
              their work — not their follower count, connections, or timing. Ranqly
              is building the infrastructure for fair, transparent, and verifiable
              content evaluation in Web3.
            </p>
          </motion.div>

          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-3"
            {...fadeIn}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {[
              { icon: Target, label: "Fairness First", desc: "Every score is transparent and auditable" },
              { icon: Heart, label: "Creator-Centric", desc: "Built for creators, by creators" },
              { icon: Globe, label: "Open & Verifiable", desc: "On-chain proof for every decision" },
            ].map((v) => (
              <div key={v.label} className="flex flex-col items-center gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15">
                  <v.icon className="h-5 w-5 text-primary-400" />
                </div>
                <p className="text-sm font-semibold text-text-primary">{v.label}</p>
                <p className="text-xs text-text-tertiary">{v.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div className="text-center" {...fadeIn} transition={{ duration: 0.6 }}>
          <Badge variant="default" size="md" className="mb-4">
            The Team
          </Badge>
          <h2 className="text-3xl font-bold text-text-primary font-display">
            Built by people who care
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">
            Our team spans Web3 engineering, mechanism design, and creator
            economy expertise.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              {...fadeIn}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="flex flex-col items-center text-center" padding="lg">
                <Avatar size="xl" fallback={member.avatar} alt={member.name} />
                <h3 className="mt-4 text-base font-semibold text-text-primary font-display">
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-primary-400">{member.role}</p>
                <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
                  {member.bio}
                </p>
                <div className="mt-3 flex gap-2">
                  <a href="#" className="text-text-disabled transition-colors hover:text-text-secondary">
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                  <a href="#" className="text-text-disabled transition-colors hover:text-text-secondary">
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-t border-border-subtle bg-bg-secondary/50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="default" size="md" className="mb-4">
              Roadmap
            </Badge>
            <h2 className="text-3xl font-bold text-text-primary font-display">
              Where we&apos;re headed
            </h2>
          </motion.div>

          <div className="relative mt-14">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 hidden w-px bg-border-subtle sm:block sm:left-1/2 sm:-translate-x-px" />

            <div className="space-y-8">
              {roadmap.map((phase, i) => (
                <motion.div
                  key={phase.quarter}
                  className={`relative flex flex-col gap-4 sm:flex-row sm:gap-8 ${
                    i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                  {...fadeIn}
                  transition={{ delay: i * 0.15 }}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-4 top-4 hidden sm:left-1/2 sm:block sm:-translate-x-1/2">
                    <div
                      className={`h-3 w-3 rounded-full ring-4 ring-bg-primary ${
                        phase.status === "completed"
                          ? "bg-success"
                          : phase.status === "current"
                          ? "bg-primary-500 animate-glow-pulse"
                          : "bg-border-medium"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${i % 2 === 0 ? "sm:text-right sm:pr-12" : "sm:pl-12"}`}>
                    <Card
                      className={
                        phase.status === "current"
                          ? "border-primary-500/40"
                          : ""
                      }
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant={
                            phase.status === "completed"
                              ? "success"
                              : phase.status === "current"
                              ? "primary"
                              : "default"
                          }
                          size="sm"
                          dot
                        >
                          {phase.quarter}
                        </Badge>
                        {phase.status === "current" && (
                          <Badge variant="primary" size="sm">Current</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-text-primary font-display">
                        {phase.title}
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {phase.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-text-tertiary">
                            <CheckCircle2
                              className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                                phase.status === "completed"
                                  ? "text-success"
                                  : "text-text-disabled"
                              }`}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden flex-1 sm:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Press Mentions */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-10" {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="default" size="md" className="mb-4">
              <Newspaper className="h-3 w-3" /> Press
            </Badge>
            <h2 className="text-2xl font-bold text-text-primary font-display">
              What people are saying
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-3">
            {press.map((item, i) => (
              <motion.div key={item.name} {...fadeIn} transition={{ delay: i * 0.1 }}>
                <Card className="text-center" padding="lg">
                  <p className="text-sm font-semibold text-primary-400 mb-2">{item.name}</p>
                  <p className="text-sm italic leading-relaxed text-text-secondary">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="border-t border-border-subtle bg-bg-secondary/50">
        <div className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-10" {...fadeIn} transition={{ duration: 0.6 }}>
            <Badge variant="default" size="md" className="mb-4">
              <Mail className="h-3 w-3" /> Contact
            </Badge>
            <h2 className="text-2xl font-bold text-text-primary font-display">
              Get in touch
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Have questions, feedback, or want to partner? We&apos;d love to hear from you.
            </p>
          </motion.div>

          {submitted ? (
            <motion.div
              className="flex flex-col items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-8 text-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="text-lg font-semibold text-text-primary">Message sent!</p>
              <p className="text-sm text-text-secondary">
                We&apos;ll get back to you within 24 hours.
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleContactSubmit}
              className="space-y-4"
              {...fadeIn}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Input
                id="contact-name"
                label="Name"
                placeholder="Your name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
              <Input
                id="contact-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
              <Textarea
                id="contact-message"
                label="Message"
                placeholder="How can we help?"
                maxLength={1000}
                charCount={contactMessage.length}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
              />
              <Button type="submit" className="w-full">
                Send Message
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.form>
          )}
        </div>
      </section>
    </div>
  );
}
