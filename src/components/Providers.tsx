"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletAuthSync } from "@/components/WalletAuthSync";
import { WalletProfileOnboardingGate } from "@/components/wallet";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WalletAuthSync />
      <WalletProfileOnboardingGate />
      {children}
    </AuthProvider>
  );
}
