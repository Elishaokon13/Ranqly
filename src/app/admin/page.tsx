"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  LayoutDashboard,
  FileWarning,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { MOCK_CONTESTS } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-8"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/explore">
          <Card padding="md" hoverable className="h-full">
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
          <Card padding="md" hoverable className="h-full">
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
        <Card padding="md" className="opacity-75">
          <CardContent className="flex items-center gap-3">
            <Users className="h-5 w-5 text-text-disabled" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">Users</p>
              <p className="text-xs text-text-tertiary">Coming soon</p>
            </div>
          </CardContent>
        </Card>
        <Card padding="md" className="opacity-75">
          <CardContent className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-text-disabled" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">Platform settings</p>
              <p className="text-xs text-text-tertiary">Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
