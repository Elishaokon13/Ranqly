"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, animate } from "framer-motion";
import { ArrowRight, Trophy, BarChart3, Shield, Sparkles, Clock } from "lucide-react";
import { Button, Badge, AvatarStack } from "@/components/ui";
import { MOCK_CONTESTS, type Contest } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Distributed", value: "$47.2M" },
  { label: "Creators", value: "52,341" },
  { label: "Partners", value: "150+" },
];

const CARD_WIDTH = 360;
const CARD_GAP = 24;
const STEP = CARD_WIDTH + CARD_GAP;
const SCROLL_DURATION_S = 40;

function HeroContestCarousel({ contests }: { contests: Contest[] }) {
  const n = contests.length;
  const loopItems = [...contests, ...contests];
  const oneSetWidth = n * STEP - CARD_GAP;
  const x = useMotionValue(0);

  useEffect(() => {
    const controls = animate(x, [0, -oneSetWidth], {
      duration: SCROLL_DURATION_S,
      repeat: Infinity,
      ease: "linear",
    });
    return () => controls.stop();
  }, [x, oneSetWidth]);

  return (
    <section className="relative overflow-hidden bg-bg-primary/50 py-6 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden py-2 sm:py-4">
          <div className="overflow-hidden py-4 px-2 sm:py-6 sm:px-3">
            <motion.div
              className="flex w-max gap-6"
              style={{ x }}
            >
              {loopItems.map((contest, i) => (
                <div
                  key={`${contest.id}-${i}`}
                  className="shrink-0 transition-transform duration-300 hover:scale-105"
                  style={{ width: CARD_WIDTH }}
                >
                  <Link
                    href={`/contest/${contest.id}`}
                    className={cn(
                      "group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-secondary",
                      "transition-all duration-300",
                      "hover:border-primary-500/50 hover:shadow-glow-primary"
                    )}
                  >
                      <div
                        className={cn(
                          "relative aspect-3/2 w-full overflow-hidden bg-linear-to-br",
                          contest.bannerColor
                        )}
                      >
                        {contest.bannerImage && (
                          <Image
                            src={contest.bannerImage}
                            alt=""
                            fill
                            className="object-cover object-center"
                            sizes="360px"
                          />
                        )}
                        <div className={cn("absolute inset-0", contest.bannerImage ? "bg-black/40" : "bg-black/10")} aria-hidden />
                      </div>
                      <div className="flex flex-col p-4">
                        <span className="text-xs font-medium text-text-tertiary">
                          {contest.organizer.name}
                        </span>
                        <h3 className="mt-0.5 line-clamp-1 text-base font-semibold text-text-primary font-display group-hover:text-primary-400 transition-colors">
                          {contest.title}
                        </h3>
                        <div className="mt-3 flex items-center gap-3 text-xs text-text-secondary">
                          <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                            <Trophy className="h-3 w-3 text-warning" />
                            {contest.prizePool}
                          </span>
                          {contest.daysRemaining > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {contest.daysRemaining}d left
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Background effects — unified gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-primary-500/30 blur-[150px]" />
        <div className="absolute bottom-0 -left-1/4 h-[600px] w-[600px] rounded-full bg-accent-500/12 blur-[120px]" />
        <div className="absolute top-1/3 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary-700/18 blur-[100px]" />
      </div>

      {/* First viewport: hero + contest carousel only (100dvh), rest on scroll */}
      <div className="flex h-dvh min-h-dvh max-h-dvh flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8 lg:px-8 lg:pt-8 lg:pb-10">
        {/* Gradient arc at bottom of hero — fits container to avoid cut edges */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full rounded-[50%] opacity-60 blur-[3px]"
          style={{
            background: "radial-gradient(ellipse 90% 60% at 50% 100%, rgba(104, 116, 232, 0.3) 0%, rgba(100, 245, 141, 0.1) 40%, transparent 65%)",
          }}
        />
        <motion.div
          className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="primary" size="lg">
            <Sparkles className="h-3.5 w-3.5" />
            Now in Beta
          </Badge>

          <h1 className="whitespace-nowrap text-4xl font-extrabold tracking-tight text-text-primary font-display sm:text-6xl lg:text-7xl">
            The{" "}
            <span className="bg-linear-to-r from-primary-400 via-primary-300 to-accent-500 bg-clip-text text-transparent">
              Fair Content
            </span>{" "}
            Layer
          </h1>

          <p className="max-w-4xl text-base leading-relaxed text-text-secondary sm:text-xl">
            Submit your best content, get scored by our transparent algorithm, earn rewards based on quality. Ranqly ensures every creator gets a fair shot.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                Launch Contest
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/explore">Explore Contests</Link>
            </Button>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
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
              Trusted by{" "}
              <span className="font-semibold text-text-primary">52,000+</span>{" "}
              creators worldwide
            </p>
          </div>
        </motion.div>

        {/* Animated Stats Ticker */}
        <motion.div
          className="mx-auto mt-5 flex max-w-lg justify-center divide-x divide-border-subtle sm:mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 px-6 text-center">
              <p className="font-numeric text-2xl font-bold text-text-primary sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Hero contest cards — floating + sliding carousel */}
      <div className="shrink-0">
        <HeroContestCarousel contests={MOCK_CONTESTS.slice(0, 5)} />
      </div>
      </div>

      {/* How It Works */}
      <section className="relative overflow-hidden border-t border-border-subtle bg-bg-secondary/50">
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-full -translate-x-1/2 rounded-[50%] opacity-35"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(104, 116, 232, 0.2) 0%, rgba(100, 245, 141, 0.08) 50%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="default" size="md" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold text-text-primary font-display sm:text-4xl">
              Three steps to fair rewards
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Our triple-layered scoring system ensures every piece of content
              is evaluated fairly and transparently.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Trophy,
                title: "Submit",
                description:
                  "Enter your best content — articles, videos, designs, code. Sign with your wallet to lock it on-chain.",
              },
              {
                step: "02",
                icon: BarChart3,
                title: "Get Scored",
                description:
                  "Our algorithm scores depth, reach, and relevance. Community votes and expert judges add their evaluation.",
              },
              {
                step: "03",
                icon: Shield,
                title: "Earn",
                description:
                  "Top creators earn from the prize pool. Rankings, scores, and audit packs are all publicly verifiable.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="relative rounded-2xl border border-border-subtle bg-bg-secondary/80 p-6 shadow-[0_0_0_1px_rgba(104,116,232,0.08),0_0_24px_-4px_rgba(104,116,232,0.15)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <span className="absolute -top-6 left-6 rounded-md bg-primary-500 px-3 py-0.5 h-10 flex items-center justify-center text-center text-xs font-bold text-white shadow-[0_0_12px_rgba(104,116,232,0.5)]">
                  {item.step}
                </span>
                <div className="mt-2 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 shadow-[0_0_20px_-4px_rgba(104,116,232,0.35)]">
                  <item.icon className="h-5 w-5 text-primary-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary font-display">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-tertiary">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fairness Guarantee */}
      <section className="relative overflow-hidden border-t border-border-subtle">
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-[50%] opacity-25"
          style={{
            background: "radial-gradient(ellipse 70% 45% at 50% 100%, rgba(100, 245, 141, 0.15) 0%, rgba(104, 116, 232, 0.08) 45%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="success" size="md" className="mb-4">
              <Shield className="h-3 w-3" />
              Fairness Guarantee
            </Badge>
            <h2 className="text-3xl font-bold text-text-primary font-display sm:text-4xl">
              Three pillars of fair scoring
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                pct: "40%",
                title: "Algorithmic Score",
                desc: "Depth, reach, relevance, and consistency — scored automatically and reproducibly.",
                color: "from-primary-400 to-primary-600",
              },
              {
                pct: "30%",
                title: "Community Vote",
                desc: "PoI NFT holders vote with written justifications. Sybil-resistant, one wallet one vote.",
                color: "from-accent-500 to-accent-700",
              },
              {
                pct: "30%",
                title: "Expert Judges",
                desc: "Anonymous panel of domain experts independently rank all entries with rationale.",
                color: "from-primary-300 to-accent-400",
              },
            ].map((pillar, i) => (
              <motion.div
                key={pillar.title}
                className="rounded-2xl border border-border-subtle bg-bg-secondary/90 p-6 text-center shadow-[0_0_0_1px_rgba(104,116,232,0.06),0_0_20px_-6px_rgba(104,116,232,0.12)] backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <p
                  className={`font-numeric bg-linear-to-r ${pillar.color} bg-clip-text text-4xl font-extrabold text-transparent`}
                >
                  {pillar.pct}
                </p>
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-text-tertiary">{pillar.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Badge variant="success" size="lg">
              <Shield className="h-3.5 w-3.5" />
              100% Auditable — Every score verifiable on-chain
            </Badge>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-border-subtle bg-bg-secondary/50">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 opacity-20"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(104, 116, 232, 0.2) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-text-primary font-display sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-text-secondary">
              Whether you&apos;re a creator looking to earn, or a project wanting to
              launch a fair contest — Ranqly has you covered.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/explore">
                  Launch a Contest
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/explore">Start Earning</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
