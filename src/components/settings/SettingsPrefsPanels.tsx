"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import {
  Button,
  Card,
  Checkbox,
  Separator,
  Badge,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAuthMe,
  patchMyProfile,
  isApiConfigured,
  downloadMyAccountExport,
  deleteMyAccount,
  setAuthToken,
  ME_UPDATED_EVENT,
} from "@/lib/api";
import { AlertTriangle, Download, Laptop, ShieldCheck, Trash2 } from "lucide-react";
import {
  normalizeUserPreferences,
  type NotificationPrefs,
  type PrivacyPrefs,
  type SecurityPrefs,
} from "@/lib/userPreferences";

function PanelLoader() {
  return (
    <Card padding="lg" className="flex min-h-[160px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </Card>
  );
}

export function SettingsNotificationsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState<NotificationPrefs | null>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setN(normalizeUserPreferences(null).notifications);
      setLoading(false);
      return;
    }
    const me = await fetchAuthMe();
    if (me) setN(normalizeUserPreferences(me.preferences).notifications);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  useEffect(() => {
    const onMe = () => void load();
    window.addEventListener(ME_UPDATED_EVENT, onMe);
    return () => window.removeEventListener(ME_UPDATED_EVENT, onMe);
  }, [load]);

  const save = async () => {
    if (!n || !isApiConfigured()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await patchMyProfile({ preferences: { notifications: n } });
      if (updated) setN(normalizeUserPreferences(updated.preferences).notifications);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !n) return <PanelLoader />;

  const row = (
    id: string,
    label: string,
    description: string | undefined,
    key: keyof NotificationPrefs
  ) => (
    <Checkbox
      key={id}
      id={id}
      label={label}
      description={description}
      checked={n[key]}
      onCheckedChange={(v) => setN((prev) => (prev ? { ...prev, [key]: Boolean(v) } : prev))}
    />
  );

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Email notifications</h3>
        <p className="mb-4 text-xs text-text-tertiary">
          Stored on your account. Delivery depends on future email integration.
        </p>
        <div className="space-y-3">
          {row("n-contest", "Contest updates", "When contests you entered change phase", "contestUpdates")}
          {row("n-rank", "Rank changes", "When your rank moves by about five positions", "rankChanges")}
          {row("n-comments", "New comments on my entries", undefined, "commentsOnEntries")}
          {row("n-voting", "Voting reminders", "When voting opens in your contests", "votingReminders")}
          {row("n-digest", "Weekly digest", undefined, "weeklyDigest")}
          {row("n-marketing", "Marketing emails", undefined, "marketingEmails")}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Push notifications (browser)</h3>
        <div className="space-y-3">
          {row("p-rank", "Real-time rank changes", undefined, "pushRankChanges")}
          {row("p-phase", "Contest phase transitions", undefined, "pushPhaseTransitions")}
          {row("p-new", "New contests matching my interests", undefined, "pushNewContests")}
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </Card>
  );
}

export function SettingsPrivacyPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [p, setP] = useState<PrivacyPrefs | null>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setP(normalizeUserPreferences(null).privacy);
      setLoading(false);
      return;
    }
    const me = await fetchAuthMe();
    if (me) setP(normalizeUserPreferences(me.preferences).privacy);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  useEffect(() => {
    const onMe = () => void load();
    window.addEventListener(ME_UPDATED_EVENT, onMe);
    return () => window.removeEventListener(ME_UPDATED_EVENT, onMe);
  }, [load]);

  const save = async () => {
    if (!p || !isApiConfigured()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await patchMyProfile({ preferences: { privacy: p } });
      if (updated) setP(normalizeUserPreferences(updated.preferences).privacy);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !p) return <PanelLoader />;

  const row = (id: string, label: string, description: string | undefined, key: keyof PrivacyPrefs) => (
    <Checkbox
      key={id}
      id={id}
      label={label}
      description={description}
      checked={p[key]}
      onCheckedChange={(v) => setP((prev) => (prev ? { ...prev, [key]: Boolean(v) } : prev))}
    />
  );

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Profile visibility</h3>
        <div className="space-y-3">
          {row("pr-public", "Public profile", "Anyone can see your profile", "publicProfile")}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Show on profile</h3>
        <div className="space-y-3">
          {row("pr-subs", "My submissions", undefined, "showSubmissions")}
          {row("pr-history", "Contest history", undefined, "showContestHistory")}
          {row("pr-earnings", "Earnings", undefined, "showEarnings")}
          {row("pr-winrate", "Win rate", undefined, "showWinRate")}
          {row("pr-votes", "Votes cast", undefined, "showVotesCast")}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Data sharing</h3>
        <div className="space-y-3">
          {row("pr-research", "Share anonymized data for research", undefined, "anonymizedResearch")}
          {row("pr-contact", "Allow organizers to contact me", undefined, "organizerContact")}
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save privacy settings"}
        </Button>
      </div>
    </Card>
  );
}

export function SettingsSecurityPanel() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [s, setS] = useState<SecurityPrefs | null>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setS(normalizeUserPreferences(null).security);
      setLoading(false);
      return;
    }
    const me = await fetchAuthMe();
    if (me) setS(normalizeUserPreferences(me.preferences).security);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  useEffect(() => {
    const onMe = () => void load();
    window.addEventListener(ME_UPDATED_EVENT, onMe);
    return () => window.removeEventListener(ME_UPDATED_EVENT, onMe);
  }, [load]);

  const saveSecurity = async () => {
    if (!s || !isApiConfigured()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await patchMyProfile({ preferences: { security: s } });
      if (updated) setS(normalizeUserPreferences(updated.preferences).security);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setBusy("export");
    setError(null);
    try {
      await downloadMyAccountExport();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm(
      "This permanently deletes your Ranqly account and related data. This cannot be undone. Continue?"
    );
    if (!ok) return;
    const second = window.prompt('Type DELETE_MY_ACCOUNT to confirm:');
    if (second !== "DELETE_MY_ACCOUNT") {
      setError("Deletion cancelled.");
      return;
    }
    setBusy("delete");
    setError(null);
    try {
      await deleteMyAccount();
      setAuthToken(null);
      if (user?.method === "wallet") disconnect?.();
      signOut();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading || !s) return <PanelLoader />;

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Two-factor authentication</h3>
        <p className="mb-4 text-xs text-text-tertiary">
          Preference is saved to your account. Full authenticator enrollment is not wired yet — this flag is for when 2FA ships.
        </p>
        <div
          className={
            s.twoFactorEnabled
              ? "flex items-center justify-between rounded-xl border border-success/30 bg-success/5 px-4 py-3"
              : "flex items-center justify-between rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3"
          }
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className={s.twoFactorEnabled ? "h-5 w-5 text-success" : "h-5 w-5 text-text-tertiary"} />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {s.twoFactorEnabled ? "2FA preference: on" : "2FA preference: off"}
              </p>
              <p className="text-xs text-text-tertiary">Authenticator app (planned)</p>
            </div>
          </div>
          {s.twoFactorEnabled ? (
            <Badge variant="success" size="sm">
              Enabled
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              Off
            </Badge>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Checkbox
            id="sec-2fa"
            label="I want two-factor authentication on my account"
            checked={s.twoFactorEnabled}
            onCheckedChange={(v) => setS((prev) => (prev ? { ...prev, twoFactorEnabled: Boolean(v) } : prev))}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={() => void saveSecurity()} disabled={saving}>
            {saving ? "Saving…" : "Save security preference"}
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Active sessions</h3>
        <p className="mb-4 text-sm text-text-tertiary">
          We do not store per-device sessions in the database yet. Use <strong>Sign out</strong> from the account menu to clear this
          browser&apos;s token. For wallet users, disconnecting the wallet also clears the app session.
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
            <div className="flex items-center gap-3">
              <Laptop className="h-4 w-4 text-text-tertiary" />
              <div>
                <p className="text-sm text-text-primary">This browser</p>
                <p className="text-xs text-text-tertiary">Current session (JWT in this device)</p>
              </div>
            </div>
            <Badge variant="primary" size="sm">
              Current
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-text-primary">
          <AlertTriangle className="h-4 w-4 text-error" />
          Danger zone
        </h3>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-text-primary">Download my data</p>
              <p className="text-xs text-text-tertiary">JSON export from the database (profile, preferences, submissions, votes)</p>
            </div>
            <Button variant="secondary" size="sm" type="button" disabled={busy !== null} onClick={() => void handleExport()}>
              <Download className="h-3.5 w-3.5" />
              {busy === "export" ? "Preparing…" : "Export"}
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-text-primary">Delete account</p>
              <p className="text-xs text-text-tertiary">Permanently removes your user row and cascaded relations</p>
            </div>
            <Button variant="danger" size="sm" type="button" disabled={busy !== null} onClick={() => void handleDelete()}>
              <Trash2 className="h-3.5 w-3.5" />
              {busy === "delete" ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </Card>
  );
}
