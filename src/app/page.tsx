"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, animate } from "framer-motion";
import { Icon } from "@/components/icons";
import { Button, Badge, AvatarStack, HeroBackground, CountUp, TiltCard } from "@/components/ui";
import type { Contest } from "@/lib/contest-types";
import { fetchContests } from "@/lib/api";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Distributed", value: { prefix: "$", end: 47.2, suffix: "M", decimals: 1 } },
  { label: "Creators", value: { end: 52341 } },
  { label: "Partners", value: { end: 150, suffix: "+" } },
];

const CAROUSEL_GAP_PX = 16;
const SCROLL_DURATION_S = 45;

function HeroContestCarousel({ contests }: { contests: Contest[] }) {
  const n = contests.length;
  const loopItems = [...contests, ...contests];
  const x = useMotionValue(0);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState<number | null>(null);

  // Measure first card width and keep in sync on resize (responsive breakpoints / zoom)
  useEffect(() => {
    const el = firstCardRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setCardWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animation: distance = one full set of cards; restart when card width or n changes
  useEffect(() => {
    if (cardWidth == null || n === 0) return;
    const step = cardWidth + CAROUSEL_GAP_PX;
    const oneSetWidth = n * step - CAROUSEL_GAP_PX;
    x.set(0);
    const controls = animate(x, [0, -oneSetWidth], {
      duration: SCROLL_DURATION_S,
      repeat: Infinity,
      ease: "linear",
    });
    return () => controls.stop();
  }, [x, n, cardWidth]);

  return (
    <section className="relative overflow-hidden bg-bg-primary/50 py-6 sm:py-10 lg:py-16">
      <div className="mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden">
          <div className="overflow-hidden py-2 sm:py-4">
            <motion.div
              className="flex w-max gap-4"
              style={{ x }}
            >
              {loopItems.map((contest, i) => (
                <div
                  key={`${contest.id}-${i}`}
                  ref={i === 0 ? firstCardRef : undefined}
                  className={cn(
                    "shrink-0 transition-transform duration-300",
                    "w-[220px] min-[380px]:w-[260px] sm:w-[300px] md:w-[320px] lg:w-[360px] xl:w-[380px]",
                    "hover:scale-[1.03] sm:hover:scale-[1.04] lg:hover:scale-105"
                  )}
                >
                  <TiltCard maxDeg={6} className="h-full">
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
                          sizes="(max-width: 380px) 220px, (max-width: 640px) 260px, (max-width: 768px) 300px, (max-width: 1024px) 320px, 360px"
                        />
                      )}
                      <div className={cn("absolute inset-0", contest.bannerImage ? "bg-black/40" : "bg-black/10")} aria-hidden />
                    </div>
                    <div className="flex flex-col p-3 sm:p-4">
                      <span className="text-xs font-medium text-text-tertiary">
                        {contest.organizer.name}
                      </span>
                      <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-text-primary font-display group-hover:text-primary-400 transition-colors sm:text-base">
                        {contest.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary sm:mt-3 sm:gap-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                          <Icon name="trophy" size="xs" className="text-warning" />
                          {contest.prizePool}
                        </span>
                        {contest.daysRemaining > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="clock" size="xs" className="text-current" />
                            {contest.daysRemaining}d left
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  </TiltCard>
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
  const [heroContests, setHeroContests] = useState<Contest[]>([]);

  useEffect(() => {
    void fetchContests({ limit: 5 }).then(setHeroContests);
  }, []);

  return (
    <div className="relative min-h-0 overflow-x-hidden">
      {/* Background effects — unified gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/3 left-1/2 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-primary-500/30 blur-[150px]" />
        <div className="absolute bottom-0 -left-1/4 h-[600px] w-[600px] rounded-full bg-accent-500/12 blur-[120px]" />
        <div className="absolute top-1/3 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary-700/18 blur-[100px]" />
      </div>

      {/* Hero + carousel: natural height on mobile, viewport-height on sm+ */}
      <div className="relative flex min-h-0 flex-col md:min-h-[calc(100dvh-var(--navbar-height,72px))]">
        <HeroBackground />
        {/* Hero Section — consistent container and spacing at all breakpoints */}
        <section className="relative w-full flex-shrink-0 overflow-hidden">
          <div className="relative mx-auto w-full max-w-content px-4 py-8 min-[480px]:py-10 sm:px-6 sm:py-12 md:py-16 lg:px-8 lg:py-20">
            {/* Gradient arc — decorative only */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full rounded-[50%] opacity-60 blur-[3px] sm:h-56"
              style={{
                background: "radial-gradient(ellipse 90% 60% at 50% 100%, rgba(104, 116, 232, 0.3) 0%, rgba(100, 245, 141, 0.1) 40%, transparent 65%)",
              }}
            />
            <motion.div
              className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 text-center min-[480px]:gap-6 sm:max-w-4xl sm:gap-7 md:gap-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="primary" size="lg">
                <Icon name="sparkles" size="sm" className="text-current" />
                Now in Beta
              </Badge>

              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-text-primary font-display min-[480px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                The{" "}
                <span className="bg-linear-to-r from-primary-400 via-primary-300 to-accent-500 bg-clip-text text-transparent">
                  Fair Content
                </span>{" "}
                Layer
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-text-secondary min-[480px]:text-base sm:max-w-3xl sm:text-lg md:text-xl">
                Submit your best content, get scored by our transparent algorithm, earn rewards based on quality. Ranqly ensures every creator gets a fair shot.
              </p>

              <div className="flex w-full max-w-xs flex-col gap-3 min-[480px]:max-w-none min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:justify-center min-[480px]:gap-4">
                <Button size="lg" className="w-full min-[480px]:w-auto" asChild>
                  <Link href="/pricing">
                    Launch Contest
                    <Icon name="arrow-right" size="sm" className="text-current" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" className="w-full min-[480px]:w-auto" asChild>
                  <Link href="/explore">Explore Contests</Link>
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
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

              {/* Stats — scroll-triggered count-up */}
              <div className="mt-2 flex w-full max-w-sm justify-center divide-x divide-border-subtle sm:max-w-lg">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-1 flex-col items-center px-3 text-center sm:px-6">
                    <p className="font-numeric text-base font-bold text-text-primary sm:text-xl md:text-2xl">
                      <CountUp
                        end={stat.value.end}
                        prefix={stat.value.prefix ?? ""}
                        suffix={stat.value.suffix ?? ""}
                        decimals={stat.value.decimals ?? 0}
                      />
                    </p>
                    <p className="mt-0.5 text-[10px] text-text-tertiary sm:text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Hero contest carousel */}
        <div className="relative flex-shrink-0">
          <HeroContestCarousel contests={heroContests} />
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
        <div className="relative mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
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
            {([
              {
                step: "01",
                icon: "trophy" as const,
                title: "Submit",
                description:
                  "Enter your best content — articles, videos, designs, code. Sign with your wallet to lock it on-chain.",
              },
              {
                step: "02",
                icon: "bar-chart" as const,
                title: "Get Scored",
                description:
                  "Our algorithm scores depth, reach, and relevance. Community votes and expert judges add their evaluation.",
              },
              {
                step: "03",
                icon: "shield" as const,
                title: "Earn",
                description:
                  "Top creators earn from the prize pool. Rankings, scores, and audit packs are all publicly verifiable.",
              },
            ] as const).map((item, i) => (
              <motion.div
                key={item.step}
                className="relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_-4px_rgba(104,116,232,0.2)] backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <span className="absolute -top-3 left-6 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-bold text-white shadow-[0_0_12px_rgba(104,116,232,0.5)]">
                  {item.step}
                </span>
                <div className="mt-2 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 shadow-[0_0_20px_-4px_rgba(104,116,232,0.35)]">
                  <Icon name={item.icon} size="lg" className="text-primary-400" />
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
        <div className="relative mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="success" size="md" className="mb-4">
              <Icon name="shield" size="xs" className="text-current" />
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
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_20px_-6px_rgba(104,116,232,0.18)] backdrop-blur-md"
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
              <Icon name="shield" size="sm" className="text-current" />
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
                <Link href="/pricing">
                  Launch a Contest
                  <Icon name="arrow-right" size="sm" className="text-current" />
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
