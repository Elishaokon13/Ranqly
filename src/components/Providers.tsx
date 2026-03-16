"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletAuthSync } from "@/components/WalletAuthSync";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WalletAuthSync />
      {children}
    </AuthProvider>
  );
}
