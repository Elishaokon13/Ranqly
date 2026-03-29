"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAuthMe, getAuthToken, setAuthToken } from "@/lib/api";

/**
 * Syncs wallet connection + backend JWT with AuthContext.
 * Merges /api/auth/me (cuid, name, avatarUrl) after SIWE.
 */
export function WalletAuthSync() {
  const { address, isConnected } = useAccount();
  const { user, signIn, signOut, mergeWalletProfileFromApi } = useAuth();
  const prevAddressRef = useRef<string | undefined>(undefined);

  const pullServerProfile = useCallback(async () => {
    if (!isConnected || !address) return;
    const token = getAuthToken();
    if (!token) return;
    signIn("wallet", address);
    const me = await fetchAuthMe();
    if (!me?.walletAddress) return;
    if (me.walletAddress.toLowerCase() !== address.toLowerCase()) return;
    mergeWalletProfileFromApi(me);
  }, [isConnected, address, signIn, mergeWalletProfileFromApi]);

  useEffect(() => {
    if (isConnected && address) {
      const token = getAuthToken();
      if (token) {
        void pullServerProfile();
      }
      prevAddressRef.current = address;
    } else {
      if (prevAddressRef.current) {
        setAuthToken(null);
        signOut();
      }
      prevAddressRef.current = undefined;
    }
  }, [isConnected, address, pullServerProfile, signOut]);

  useEffect(() => {
    const onToken = () => {
      void pullServerProfile();
    };
    window.addEventListener("ranqly-token-change", onToken);
    return () => window.removeEventListener("ranqly-token-change", onToken);
  }, [pullServerProfile]);

  useEffect(() => {
    if (user?.method === "wallet" && !getAuthToken()) {
      signOut();
    }
  }, [user?.method, signOut]);

  return null;
}
