"use client";

import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider, type Config, cookieToInitialState } from "wagmi";
import { wagmiAdapter, projectId, networks } from "@/config/appkit";
import { siweConfig } from "@/config/siwe";
import { mainnet } from "@reown/appkit/networks";

const queryClient = new QueryClient();

const metadata = {
  name: "Ranqly",
  description: "The Fair Content Layer for Web3",
  url: typeof window !== "undefined" ? window.location.origin : "https://ranqly.xyz",
  icons: ["https://ranqly.xyz/icon.png"],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || "00000000000000000000000000000000",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AppKit network type is compatible with viem Chain
  networks: networks as any,
  defaultNetwork: mainnet,
  metadata,
  siweConfig,
  features: {
    analytics: false,
  },
});

export function AppKitProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
