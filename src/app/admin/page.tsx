"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  FileWarning,
  Users,
  Settings,
  ChevronRight,
  BadgeCheck,
  MessageCircle,
  Sliders,
  ScrollText,
  HeadphonesIcon,
} from "lucide-react";
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { MOCK_CONTESTS } from "@/lib/mock-data";

const ADMIN_TABS = [
  "overview",
  "organizer-verification",
  "disputes",
  "moderation",
  "algorithm-tuning",
  "system-logs",
  "user-support",
] as const;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<(typeof ADMIN_TABS)[number]>("overview");

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Admin
            </h1>
            <p className="text-sm text-text-tertiary">
              Moderation, contests, and platform settings. (Placeholder — access control not implemented.)
            </p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof ADMIN_TABS)[number])}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizer-verification">Organizer verification</TabsTrigger>
          <TabsTrigger value="disputes">Dispute triage</TabsTrigger>
          <TabsTrigger value="moderation">Content moderation</TabsTrigger>
          <TabsTrigger value="algorithm-tuning">Algorithm tuning</TabsTrigger>
          <TabsTrigger value="system-logs">System logs</TabsTrigger>
          <TabsTrigger value="user-support">User support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/explore">
              <Card hoverable className="h-full">
                <CardContent className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-primary-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">Contests</p>
                    <p className="text-xs text-text-tertiary">
                      {MOCK_CONTESTS.length} total
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/disputes">
              <Card hoverable className="h-full">
                <CardContent className="flex items-center gap-3">
                  <FileWarning className="h-5 w-5 text-warning" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">Disputes</p>
                    <p className="text-xs text-text-tertiary">Review queue</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </CardContent>
              </Card>
            </Link>
            <Card>
              <CardContent className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary">Users</p>
                  <p className="text-xs text-text-tertiary">Search, roles, and activity</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary">Platform settings</p>
                  <p className="text-xs text-text-tertiary">Fees, limits, and config</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organizer-verification">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-display font-semibold text-text-primary">Pending verification</h3>
              <p className="mt-1 text-sm text-text-tertiary">Review organization details and documents.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left text-text-tertiary">
                      <th className="pb-3 pr-4 font-medium">Organization</th>
                      <th className="pb-3 pr-4 font-medium">Submitted</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={3} className="py-8 text-center text-text-tertiary">No pending requests</td></tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-display font-semibold text-text-primary">Dispute triage</h3>
              <p className="mt-1 text-sm text-text-tertiary">Review and resolve contest or entry disputes.</p>
              <Button className="mt-4" asChild><Link href="/disputes">Open disputes</Link></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-display font-semibold text-text-primary">Content moderation queue</h3>
              <p className="mt-1 text-sm text-text-tertiary">Flagged entries and reports.</p>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm">Pending</Button>
                <Button variant="ghost" size="sm">Reviewed</Button>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="rounded-lg border border-border-subtle bg-bg-tertiary/30 px-4 py-6 text-center text-sm text-text-tertiary">No items in queue</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algorithm-tuning">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-display font-semibold text-text-primary">Algorithm parameters</h3>
              <p className="mt-1 text-sm text-text-tertiary">Weights and thresholds for scoring.</p>
              <div className="mt-6 space-y-6 max-w-md">
                <div>
                  <label className="text-sm font-medium text-text-primary">Algorithm weight (default 40%)</label>
                  <input type="range" min="20" max="60" defaultValue="40" className="mt-2 w-full accent-primary-500" />
                  <p className="mt-1 text-xs text-text-tertiary">Community and judge weights adjust automatically.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Minimum quality threshold</label>
                  <input type="number" min="0" max="100" defaultValue="30" className="mt-2 h-10 w-24 rounded-xl border border-border-subtle bg-bg-secondary px-3 text-sm" />
                </div>
                <Button size="sm">Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-logs">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-display font-semibold text-text-primary">System logs</h3>
              <p className="mt-1 text-sm text-text-tertiary">Audit trail of admin and system events.</p>
              <div className="mt-4 flex gap-2">
                <input placeholder="Search logs..." className="h-10 flex-1 rounded-xl border border-border-subtle bg-bg-secondary px-4 text-sm" />
                <Button variant="secondary" size="sm">Filter</Button>
              </div>
              <div className="mt-4 rounded-xl border border-border-subtle bg-bg-tertiary/30 font-mono text-xs overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle text-left text-text-tertiary">
                      <th className="p-3 font-medium">Time</th>
                      <th className="p-3 font-medium">Event</th>
                      <th className="p-3 font-medium">Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={3} className="p-6 text-center text-text-tertiary">No logs to display</td></tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-support">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-display font-semibold text-text-primary">Support tickets</h3>
              <p className="mt-1 text-sm text-text-tertiary">User inquiries and escalations.</p>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm">Open</Button>
                <Button variant="ghost" size="sm">Resolved</Button>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-tertiary/30 px-4 py-3">
                  <span className="text-sm text-text-primary">No open tickets</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
