/**
 * AppKit (Reown) + Wagmi config. No 'use client' — used for cookieToInitialState on server.
 * Set NEXT_PUBLIC_PROJECT_ID from https://dashboard.reown.com
 */
import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, base } from "@reown/appkit/networks";

/** Set in .env.local from https://dashboard.reown.com — required to avoid 403 from Reown API. */
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  console.warn(
    "[AppKit] Set NEXT_PUBLIC_PROJECT_ID in .env.local (get a free ID at https://dashboard.reown.com). Without it, wallet connection may show a 403 error."
  );
}

export const networks = [mainnet, base];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: projectId || "00000000000000000000000000000000",
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
