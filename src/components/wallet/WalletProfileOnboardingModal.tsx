"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  Button,
  Input,
} from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAuthMe, patchMyProfile, uploadProfileAvatar, isApiConfigured } from "@/lib/api";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WalletProfileOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletProfileOnboardingModal({ open, onOpenChange }: WalletProfileOnboardingModalProps) {
  const { updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    void (async () => {
      const me = await fetchAuthMe();
      if (me?.name) setDisplayName(me.name);
      if (me?.email) setEmail(me.email);
    })();
  }, [open]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = useCallback(async () => {
    const name = displayName.trim();
    const emailTrim = email.trim().toLowerCase();
    if (name.length < 2) {
      setError("Please enter a display name (at least 2 characters).");
      return;
    }
    if (!emailTrim || !EMAIL_RE.test(emailTrim)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isApiConfigured()) {
      setError("API is not available.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let uploadedAvatarUrl: string | undefined;
      if (file) {
        const up = await uploadProfileAvatar(file);
        uploadedAvatarUrl = up.avatarUrl;
      }
      const updated = await patchMyProfile({ name, email: emailTrim });
      const avatarUrl = updated.avatarUrl ?? uploadedAvatarUrl;
      updateUserProfile({
        name: updated.name ?? name,
        email: updated.email ?? emailTrim,
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      onOpenChange(false);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }, [displayName, email, file, onOpenChange, updateUserProfile]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalHeader showClose={false}>
        <ModalTitle>Finish your profile</ModalTitle>
        <ModalDescription>
          Add your name, email, and an optional photo so the community recognizes you.
        </ModalDescription>
      </ModalHeader>

      <div className="space-y-4">
        <Input
          id="wallet-profile-name"
          label="Display name"
          placeholder="How you appear on Ranqly"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="nickname"
        />
        <Input
          id="wallet-profile-email"
          type="email"
          inputMode="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          hint="Required — we use this for important account updates."
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>

      <p className="mt-6 text-center text-xs font-medium uppercase tracking-wide text-text-tertiary">
        Profile photo (optional)
      </p>
      <div className="mt-2 flex flex-col items-center gap-3">
        <button
          type="button"
          className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          onClick={() => inputRef.current?.click()}
        >
          <div
            className={cn(
              "flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-border-subtle bg-bg-tertiary text-2xl font-semibold text-text-secondary"
            )}
          >
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-bg-secondary bg-primary-500 text-white shadow-md">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFile(f ?? null);
            e.target.value = "";
          }}
        />
        <p className="text-center text-xs text-text-tertiary">Max 2MB — PNG, JPEG, WebP, etc.</p>
      </div>

      <div className="mt-8 flex justify-end">
        <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save & continue"
          )}
        </Button>
      </div>
    </Modal>
  );
}
