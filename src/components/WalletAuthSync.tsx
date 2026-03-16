"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthToken, setAuthToken } from "@/lib/api";

/**
 * Syncs wallet connection + backend JWT with AuthContext.
 * When wallet is connected and we have a token, set user in AuthContext.
 * When wallet disconnects or token is cleared, sign out.
 */
export function WalletAuthSync() {
  const { address, isConnected } = useAccount();
  const { user, signIn, signOut } = useAuth();
  const prevAddressRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isConnected && address) {
      const token = getAuthToken();
      if (token) {
        signIn("wallet", address);
      }
      prevAddressRef.current = address;
    } else {
      if (prevAddressRef.current) {
        setAuthToken(null);
        signOut();
      }
      prevAddressRef.current = undefined;
    }
  }, [isConnected, address, signIn, signOut]);

  // If we had a wallet user but token was cleared (e.g. backend signOut), clear user
  useEffect(() => {
    if (user?.method === "wallet" && !getAuthToken()) {
      signOut();
    }
  }, [user?.method, signOut]);

  return null;
}
