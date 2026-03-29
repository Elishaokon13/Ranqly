"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAuthMe,
  patchMyProfile,
  uploadProfileAvatar,
  isApiConfigured,
  publicAssetUrl,
  type AuthMeUser,
} from "@/lib/api";
import { Button, Input, Avatar, Card, Separator, Badge } from "@/components/ui";
import { Wallet, Twitter, Github, BookOpen } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function shortenAddress(addr: string | null | undefined): string {
  if (!addr || !addr.startsWith("0x") || addr.length < 10) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function SettingsProfilePanel() {
  const { updateUserProfile } = useAuth();
  const [me, setMe] = useState<AuthMeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!isApiConfigured()) {
      setLoading(false);
      return;
    }
    setError(null);
    const data = await fetchAuthMe();
    setMe(data);
    if (data) {
      setName(data.name ?? "");
      setEmail(data.email ?? "");
    }
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

  const handleSaveProfile = async () => {
    const n = name.trim();
    const em = email.trim().toLowerCase();
    if (n.length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }
    if (!em || !EMAIL_RE.test(em)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isApiConfigured()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await patchMyProfile({ name: n, email: em });
      setMe(updated);
      updateUserProfile({
        name: updated.name ?? n,
        email: updated.email ?? em,
        ...(updated.avatarUrl ? { avatarUrl: updated.avatarUrl } : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !isApiConfigured()) return;
    setSaving(true);
    setError(null);
    try {
      const { avatarUrl } = await uploadProfileAvatar(file);
      const updated = await fetchAuthMe();
      if (updated) setMe(updated);
      updateUserProfile({ avatarUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card padding="lg" className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </Card>
    );
  }

  if (!me) {
    return (
      <Card padding="lg">
        <p className="text-sm text-text-secondary">Could not load your profile from the server.</p>
        <Button className="mt-4" variant="secondary" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </Card>
    );
  }

  const avatarSrc = me.avatarUrl ? publicAssetUrl(me.avatarUrl) : undefined;
  const initials =
    (me.name?.trim() || me.email?.trim() || "?")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Profile Information</h3>
        <p className="mb-4 text-xs text-text-tertiary">
          Loaded from your account on the server. Changes are saved to the database.
        </p>
        <div className="mb-6 flex items-center gap-4">
          <Avatar size="lg" src={avatarSrc || undefined} fallback={initials} alt="" />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(ev) => void handleAvatarChange(ev)}
            />
            <Button
              variant="secondary"
              size="sm"
              type="button"
              disabled={saving}
              onClick={() => fileRef.current?.click()}
            >
              Change avatar
            </Button>
            <p className="mt-1 text-xs text-text-disabled">JPG, PNG, WebP, etc. Max 2MB.</p>
          </div>
        </div>
        <div className="space-y-4">
          <Input
            id="s-name"
            label="Display name"
            placeholder="Your name"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            autoComplete="nickname"
          />
          <Input
            id="s-email"
            type="email"
            inputMode="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => void handleSaveProfile()} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Connected wallet</h3>
        {me.walletAddress ? (
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
            <div className="flex items-center gap-3">
              <Wallet className="h-4 w-4 text-primary-400" />
              <div>
                <p className="font-mono text-sm text-text-primary">{shortenAddress(me.walletAddress)}</p>
                <p className="text-xs text-text-tertiary">Primary wallet (from sign-in)</p>
              </div>
            </div>
            <Badge variant="primary" size="sm">
              Primary
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No wallet on file for this account.</p>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-base font-semibold text-text-primary">Connected social accounts</h3>
        <p className="mb-4 text-sm text-text-tertiary">
          Linking Twitter, GitHub, and Medium is not available yet — this section is a preview only.
        </p>
        <div className="space-y-2">
          {[
            { icon: Twitter, name: "Twitter" },
            { icon: Github, name: "GitHub" },
            { icon: BookOpen, name: "Medium" },
          ].map((social) => (
            <div
              key={social.name}
              className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3 opacity-60"
            >
              <div className="flex items-center gap-3">
                <social.icon className="h-4 w-4 text-text-disabled" />
                <p className="text-sm text-text-primary">{social.name}</p>
              </div>
              <Button variant="secondary" size="sm" type="button" disabled>
                Soon
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
