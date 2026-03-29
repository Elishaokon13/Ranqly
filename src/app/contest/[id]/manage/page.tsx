"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Users, FileText } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MOCK_CONTESTS } from "@/lib/mock-data";

export default function ContestManagePage() {
  const params = useParams();
  const id = params?.id as string;
  const contest = MOCK_CONTESTS.find((c) => c.id === id);

  if (!contest) {
    return (
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-text-secondary">Contest not found.</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/dashboard/organizer">Back to organizer dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/dashboard/organizer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Organizer dashboard
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Manage: {contest.title}
          </h1>
          <p className="mt-2 text-text-secondary">
            Phase: {contest.phase} · ID: {contest.id}
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href={`/contest/${contest.id}`}>
            <Card hoverable className="h-full">
              <CardContent className="flex items-center gap-3 p-4">
                <FileText className="h-5 w-5 text-primary-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary">View contest</p>
                  <p className="text-xs text-text-tertiary">Public page</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-5 w-5 text-primary-400" />
                <p className="font-medium text-text-primary">Settings</p>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-text-tertiary">Max submissions</label>
                  <input type="number" defaultValue={contest.maxSubmissions} className="mt-1 w-full rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2" />
                </div>
                <Button variant="secondary" size="sm">Save</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-primary-400" />
                <p className="font-medium text-text-primary">Submissions & judges</p>
              </div>
              <p className="text-xs text-text-tertiary mb-3">{contest.submissionsCount} submissions · Phase: {contest.phase}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/contest/${contest.id}?tab=submissions`}>View submissions</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/contest/${contest.id}/manage/judges`}>Manage judges</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}
