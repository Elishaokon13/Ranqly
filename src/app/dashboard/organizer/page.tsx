"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, List, ChevronRight, BadgeCheck } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MOCK_CONTESTS } from "@/lib/mock-data";

export default function OrganizerDashboardPage() {
  const myContests = MOCK_CONTESTS.slice(0, 3);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              Organizer dashboard
            </h1>
            <p className="mt-2 text-text-secondary">
              Create and manage your contests.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/contest/create">
                <Plus className="mr-2 h-4 w-4" />
                Create new contest
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/organizer/verify">
                <BadgeCheck className="mr-2 h-4 w-4" />
                Verification
              </Link>
            </Button>
          </div>
        </motion.div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
              Your contests
            </h2>
            {myContests.length === 0 ? (
              <p className="py-8 text-center text-text-secondary">
                No contests yet. Create your first contest to get started.
              </p>
            ) : (
              <ul className="space-y-3">
                {myContests.map((c) => (
                  <li key={c.id}>
                    <Link href={`/contest/${c.id}/manage`}>
                      <Card hoverable className="flex items-center gap-4 p-4">
                        <List className="h-5 w-5 text-primary-400" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text-primary">{c.title}</p>
                          <p className="text-xs text-text-tertiary">
                            {c.phase} · {c.id}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-text-tertiary" />
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-text-tertiary">
          <Link href="/dashboard" className="text-primary-400 hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </RequireAuth>
  );
}
