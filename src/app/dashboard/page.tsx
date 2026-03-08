"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Gavel,
  Compass,
  Settings,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MOCK_MY_SUBMISSIONS, MOCK_CONTESTS } from "@/lib/mock-data";

const JUDGING_PHASES = ["judging", "finalization"] as const;

export default function DashboardPage() {
  const submissionsCount = MOCK_MY_SUBMISSIONS.filter(
    (s) => s.status !== "withdrawn"
  ).length;
  const judgeAssignmentsCount = MOCK_CONTESTS.filter((c) =>
    JUDGING_PHASES.includes(c.phase as (typeof JUDGING_PHASES)[number])
  ).length;

  const links = [
    {
      href: "/submissions",
      label: "My submissions",
      description: "View and manage your contest entries",
      icon: FileText,
      stat: `${submissionsCount} active`,
    },
    {
      href: "/judge",
      label: "Judge",
      description: "Score entries in contests you're judging",
      icon: Gavel,
      stat: judgeAssignmentsCount > 0 ? `${judgeAssignmentsCount} contest(s)` : "No assignments",
    },
    {
      href: "/explore",
      label: "Explore contests",
      description: "Discover and enter new contests",
      icon: Compass,
      stat: undefined,
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      description: "Top entries and winners",
      icon: Trophy,
      stat: undefined,
    },
    {
      href: "/settings",
      label: "Settings",
      description: "Profile, notifications, privacy",
      icon: Settings,
      stat: undefined,
    },
  ];

  return (
    <RequireAuth>
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="mt-2 text-text-secondary">
          Quick access to your submissions, judging, and settings.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link href={item.href}>
                <Card
                  padding="md"
                  hoverable
                  className="h-full transition-opacity hover:opacity-95"
                >
                  <CardContent className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-display font-semibold text-text-primary">
                          {item.label}
                        </h2>
                        <ChevronRight className="h-5 w-5 shrink-0 text-text-tertiary" />
                      </div>
                      <p className="mt-1 text-sm text-text-tertiary">
                        {item.description}
                      </p>
                      {item.stat && (
                        <p className="mt-2 text-xs font-medium text-primary-400">
                          {item.stat}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
    </RequireAuth>
  );
}
