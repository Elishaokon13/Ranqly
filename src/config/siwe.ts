"use client";

/**
 * SIWE config per Reown Next.js docs: https://docs.reown.com/appkit/next/core/siwe
 * One-Click Auth: getMessageParams + formatMessage(args, address). Backend handles nonce + verify.
 */

import type {
  SIWECreateMessageArgs,
  SIWEVerifyMessageArgs,
  SIWESession,
} from "@reown/appkit-siwe";
import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";
import { mainnet, base } from "@reown/appkit/networks";
import { SiweMessage } from "siwe";
import { isApiConfigured, apiUrl, setAuthToken } from "@/lib/api";

const SIWE_SESSION_KEY = "ranqly_siwe_session";

function getStoredSession(): SIWESession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SIWE_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { address: string; chainId: number };
    if (typeof data.address === "string" && typeof data.chainId === "number")
      return data;
    return null;
  } catch {
    return null;
  }
}

function setStoredSession(address: string, chainId: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    SIWE_SESSION_KEY,
    JSON.stringify({ address, chainId })
  );
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SIWE_SESSION_KEY);
}

export const siweConfig = createSIWEConfig({
  getMessageParams: async () => ({
    domain: typeof window !== "undefined" ? window.location.host : "",
    uri: typeof window !== "undefined" ? window.location.origin : "",
    chains: [mainnet.id, base.id],
    statement: "Sign in to Ranqly with your wallet.",
  }),
  createMessage: ({ address, ...args }: SIWECreateMessageArgs) =>
    formatMessage(args, address),
  getNonce: async () => {
    if (!isApiConfigured()) throw new Error("API disabled (set NEXT_PUBLIC_USE_MOCK_API off and run npm run dev with the API).");
    let res: Response;
    try {
      res = await fetch(apiUrl("/api/auth/nonce"), { method: "GET", cache: "no-store" });
    } catch {
      throw new Error(
        `Cannot reach Ranqly API at ${apiUrl("/api/auth/nonce")}. Is the unified server running (npm run dev)?`
      );
    }
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          `Nonce request returned 404 — the Ranqly API is not available at this origin. On Vercel only the Next.js app runs by default; the Express API in /backend is separate. Set NEXT_PUBLIC_API_URL to your deployed API (e.g. Railway/Render) or add Next.js API routes for /api/auth/*.`
        );
      }
      throw new Error(`Nonce request failed (${res.status}). Check API logs, DATABASE_URL, and JWT_SECRET on the server.`);
    }
    const data = (await res.json()) as { nonce?: string };
    const nonce = data.nonce;
    if (!nonce) throw new Error("No nonce in response");
    return nonce;
  },
  getSession: async () => getStoredSession(),
  verifyMessage: async ({ message, signature }: SIWEVerifyMessageArgs) => {
    if (!isApiConfigured()) return false;
    try {
      const res = await fetch(apiUrl("/api/auth/siwe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      const data = (await res.json()) as {
        token?: string;
        address?: string;
        chainId?: number;
        error?: string;
        details?: string;
      };
      if (res.ok && data.token) {
        setAuthToken(data.token);
        const siweMessage = new SiweMessage(message);
        const address = (data.address ?? siweMessage.address)?.toLowerCase();
        const chainId = data.chainId ?? siweMessage.chainId;
        if (address && chainId != null) setStoredSession(address, chainId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  signOut: async () => {
    setAuthToken(null);
    clearStoredSession();
    return true;
  },
});
