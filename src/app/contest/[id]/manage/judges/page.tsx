"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Link2,
  Copy,
  Check,
  Mail,
  Users,
  Send,
  Gavel,
} from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { fetchContest, fetchContestJudges } from "@/lib/api";
import type { Contest } from "@/lib/contest-types";

export default function ManageJudgesPage() {
  const params = useParams();
  const id = params?.id as string;
  const [contest, setContest] = useState<Contest | null | undefined>(undefined);
  const [judges, setJudges] = useState<Awaited<ReturnType<typeof fetchContestJudges>>>([]);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [judgeLink, setJudgeLink] = useState("");

  useEffect(() => {
    if (!id) return;
    void fetchContest(id).then(setContest);
  }, [id]);

  useEffect(() => {
    if (!contest) return;
    void fetchContestJudges(contest.id).then(setJudges);
  }, [contest]);

  useEffect(() => {
    if (typeof window !== "undefined" && contest)
      setJudgeLink(`${window.location.origin}/contest/${contest.id}/judge`);
  }, [contest]);

  if (contest === undefined) {
    return (
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

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

  const copyLink = () => {
    if (typeof navigator === "undefined") return;
    const url = judgeLink || (typeof window !== "undefined" ? `${window.location.origin}/contest/${contest.id}/judge` : "");
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isJudgingPhase = ["judging", "finalization"].includes(contest.phase);

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
            <Link href={`/contest/${contest.id}/manage`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Manage contest
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Manage judges
          </h1>
          <p className="mt-2 text-text-secondary">
            {contest.title}
          </p>
        </motion.div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-5 w-5 text-primary-400" />
              <h2 className="font-display font-semibold text-text-primary">
                Judge link
              </h2>
            </div>
            <p className="text-sm text-text-tertiary mb-4">
              Share this link with your judges. They sign in (or create an account) and land directly on the judging page—no long process.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                readOnly
                value={judgeLink || `/contest/${contest.id}/judge`}
                className="flex-1 rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3 text-sm text-text-primary font-mono"
              />
              <Button
                variant="secondary"
                onClick={copyLink}
                className="shrink-0 inline-flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy link
                  </>
                )}
              </Button>
            </div>
            {!isJudgingPhase && (
              <p className="mt-3 text-xs text-text-tertiary">
                The judging page is only available when the contest is in Judging or Finalization phase. You can still share the link now; judges will see it when the phase starts.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary-400" />
              <h2 className="font-display font-semibold text-text-primary">
                Invite by email
              </h2>
            </div>
            <p className="text-sm text-text-tertiary mb-4">
              Send the judge link to specific people. They’ll get an email with the link.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                type="email"
                placeholder="judge@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                label="Email address"
                className="sm:max-w-xs"
              />
              <Button variant="secondary" className="shrink-0 inline-flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send invite
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary-400" />
              <h2 className="font-display font-semibold text-text-primary">
                Judges
              </h2>
            </div>
            <p className="text-sm text-text-tertiary mb-4">
              People you’ve invited and their judging progress.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-text-tertiary">
                    <th className="pb-3 pr-4 font-medium">Email / User</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {judges.map((j) => (
                    <tr key={j.id} className="border-b border-border-subtle/50">
                      <td className="py-3 pr-4 text-text-primary">
                        {j.email ?? j.user?.email ?? j.user?.name ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">{j.status}</td>
                    </tr>
                  ))}
                  {judges.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-text-tertiary">
                        No judges invited yet. Share the link above or send email invites.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {judges.length > 0 && (
              <Button variant="ghost" size="sm" className="mt-4 inline-flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                Remind all judges
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
