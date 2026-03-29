"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Gavel,
  Compass,
  Settings,
  ChevronRight,
  Trophy,
  BarChart3,
  Coins,
  Award,
} from "lucide-react";
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MOCK_MY_SUBMISSIONS, MOCK_CONTESTS } from "@/lib/mock-data";

const JUDGING_PHASES = ["judging", "finalization"] as const;
const DASHBOARD_TABS = ["overview", "submissions", "analytics", "earnings", "reputation"] as const;

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam && DASHBOARD_TABS.includes(tabParam as (typeof DASHBOARD_TABS)[number])
    ? (tabParam as (typeof DASHBOARD_TABS)[number])
    : "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

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
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-6"
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof DASHBOARD_TABS)[number])}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="reputation">Reputation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
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
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <FileText className="h-12 w-12 text-text-tertiary" />
              <p className="text-text-secondary">
                View and manage all your contest entries in one place.
              </p>
              <Button asChild>
                <Link href="/submissions">My submissions</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-text-tertiary">Total submissions</p>
                  <p className="mt-1 font-display text-2xl font-bold text-text-primary">{MOCK_MY_SUBMISSIONS.filter((s) => s.status !== "withdrawn").length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-text-tertiary">Contests entered</p>
                  <p className="mt-1 font-display text-2xl font-bold text-text-primary">
                    {new Set(MOCK_MY_SUBMISSIONS.map((s) => s.contestId)).size}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-text-tertiary">Top placement</p>
                  <p className="mt-1 font-display text-2xl font-bold text-text-primary">
                    {(() => {
                      const withRank = MOCK_MY_SUBMISSIONS.filter((s) => s.rank != null);
                      if (withRank.length === 0) return "—";
                      const best = Math.min(...withRank.map((s) => s.rank!));
                      return `#${best}`;
                    })()}
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display font-semibold text-text-primary">Performance over time</h3>
                <p className="mt-1 text-sm text-text-tertiary">Views and engagement for your entries.</p>
                <div className="mt-6 flex h-48 items-center justify-center rounded-xl border border-dashed border-border-subtle bg-bg-tertiary/30">
                  <div className="flex flex-col items-center gap-2 text-text-tertiary">
                    <BarChart3 className="h-10 w-10" />
                    <span className="text-sm">Chart will show when you have more activity</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display font-semibold text-text-primary">Recent entries</h3>
                <ul className="mt-4 space-y-3">
                  {MOCK_MY_SUBMISSIONS.filter((s) => s.status !== "withdrawn").slice(0, 5).map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-tertiary/30 px-4 py-3">
                      <span className="font-medium text-text-primary">{s.title}</span>
                      <span className="text-sm text-text-tertiary">{s.status} {s.rank != null ? `· Rank #${s.rank}` : ""}</span>
                    </li>
                  ))}
                  {MOCK_MY_SUBMISSIONS.filter((s) => s.status !== "withdrawn").length === 0 && (
                    <li className="rounded-lg border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-tertiary">No submissions yet</li>
                  )}
                </ul>
                <Button variant="secondary" className="mt-4" asChild><Link href="/submissions">View all</Link></Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display font-semibold text-text-primary">Available balance</h3>
                <p className="mt-2 font-display text-3xl font-bold text-primary-400">0 USDC</p>
                <p className="mt-1 text-sm text-text-tertiary">Prize earnings will appear here after contests finalize.</p>
                <Button variant="secondary" className="mt-4" size="sm">Withdraw</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display font-semibold text-text-primary">Earnings history</h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-left text-text-tertiary">
                        <th className="pb-3 pr-4 font-medium">Contest</th>
                        <th className="pb-3 pr-4 font-medium">Place</th>
                        <th className="pb-3 pr-4 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_MY_SUBMISSIONS.filter((s) => s.rank != null && s.rank <= 10).map((s) => (
                        <tr key={s.id} className="border-b border-border-subtle/50">
                          <td className="py-3 pr-4 text-text-primary">{s.title}</td>
                          <td className="py-3 pr-4 text-text-secondary">#{s.rank}</td>
                          <td className="py-3 pr-4 text-success">—</td>
                          <td className="py-3 text-text-tertiary">Pending</td>
                        </tr>
                      ))}
                      {MOCK_MY_SUBMISSIONS.filter((s) => s.rank != null && s.rank <= 10).length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-text-tertiary">No earnings yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reputation">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/15">
                      <Award className="h-8 w-8 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-tertiary">Reputation score</p>
                      <p className="font-display text-3xl font-bold text-text-primary">—</p>
                      <p className="text-xs text-text-tertiary">Based on quality and consistency of entries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-text-tertiary">Badges</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-secondary">No badges yet</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display font-semibold text-text-primary">Reputation history</h3>
                <p className="mt-1 text-sm text-text-tertiary">Score changes from contests and community feedback.</p>
                <ul className="mt-4 space-y-2">
                  <li className="rounded-lg border border-dashed border-border-subtle px-4 py-6 text-center text-sm text-text-tertiary">
                    Activity will appear here as you compete and receive feedback.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </RequireAuth>
  );
}
