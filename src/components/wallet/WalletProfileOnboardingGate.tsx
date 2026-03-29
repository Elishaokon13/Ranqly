"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAuthMe, getAuthToken, isApiConfigured } from "@/lib/api";
import { WalletProfileOnboardingModal } from "./WalletProfileOnboardingModal";

function profileComplete(me: { name: string | null; email: string | null }): boolean {
  return Boolean(me.name?.trim() && me.email?.trim());
}

export function WalletProfileOnboardingGate() {
  const { isLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  const evaluate = useCallback(async () => {
    if (isLoading || !isApiConfigured()) {
      setChecked(true);
      return;
    }
    const addr = address?.toLowerCase();
    if (!isConnected || !addr) {
      setOpen(false);
      setChecked(true);
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setOpen(false);
      setChecked(true);
      return;
    }
    const me = await fetchAuthMe();
    const meAddr = me?.walletAddress?.toLowerCase() ?? "";
    if (!me || meAddr !== addr) {
      setOpen(false);
      setChecked(true);
      return;
    }
    if (!profileComplete(me)) {
      setOpen(true);
    } else {
      setOpen(false);
    }
    setChecked(true);
  }, [isLoading, isConnected, address]);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  useEffect(() => {
    const onToken = () => {
      setChecked(false);
      void evaluate();
    };
    window.addEventListener("ranqly-token-change", onToken);
    return () => window.removeEventListener("ranqly-token-change", onToken);
  }, [evaluate]);

  /** Block dismiss until name and email are saved. */
  const handleOpenChange = useCallback((next: boolean) => {
    if (next) {
      setOpen(true);
      return;
    }
    void (async () => {
      const me = await fetchAuthMe();
      if (me && !profileComplete(me)) {
        return;
      }
      setOpen(false);
    })();
  }, []);

  if (!checked) return null;

  return <WalletProfileOnboardingModal open={open} onOpenChange={handleOpenChange} />;
}
