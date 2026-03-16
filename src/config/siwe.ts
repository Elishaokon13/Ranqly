"use client";

/**
 * SIWE config for Reown AppKit — nonce and verify go to our backend; session stored in sessionStorage + JWT in localStorage.
 * getMessageParams is required for SIWX (AppKit 1.5+) so the sign view can build the message.
 */
import { SiweMessage } from "siwe";
import type { SIWECreateMessageArgs, SIWEVerifyMessageArgs } from "@reown/appkit-siwe";
import { createSIWEConfig } from "@reown/appkit-siwe";
import { mainnet, base } from "@reown/appkit/networks";
import { getApiBase, setAuthToken } from "@/lib/api";

const SIWE_SESSION_KEY = "ranqly_siwe_session";

function getStoredSession(): { address: string; chainId: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SIWE_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { address: string; chainId: number };
    if (typeof data.address === "string" && typeof data.chainId === "number") return data;
    return null;
  } catch {
    return null;
  }
}

function setStoredSession(address: string, chainId: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SIWE_SESSION_KEY, JSON.stringify({ address, chainId }));
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SIWE_SESSION_KEY);
}

/** SIWX may pass CAIP-10/25 (eip155:chainId:0x...) — SiweMessage needs plain 0x address. */
function normalizeAddress(addr: string | undefined): string {
  if (!addr || typeof addr !== "string") return "";
  const trimmed = addr.trim();
  const match = trimmed.match(/^(?:eip155:\d+:)?(0x[a-fA-F0-9]{40})$/);
  if (match) return match[1];
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return trimmed;
  return trimmed;
}

export const siweConfig = createSIWEConfig({
  getMessageParams: async () => ({
    domain: typeof window !== "undefined" ? window.location.host : "localhost",
    uri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    chains: [mainnet.id, base.id],
    statement: "Sign in to Ranqly with your wallet.",
  }),

  createMessage: ({ nonce, address, chainId }: SIWECreateMessageArgs) => {
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) throw new Error("Invalid address for SIWE message");
    return new SiweMessage({
      version: "1",
      domain: typeof window !== "undefined" ? window.location.host : "localhost",
      uri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      address: normalizedAddress,
      chainId: Number(chainId) || 1,
      nonce,
      statement: "Sign in to Ranqly with your wallet.",
    }).prepareMessage();
  },

  getNonce: async () => {
    const apiBase = getApiBase();
    if (!apiBase) throw new Error("Backend not configured (NEXT_PUBLIC_API_URL)");
    const res = await fetch(`${apiBase}/api/auth/nonce`, { method: "GET", cache: "no-store" });
    if (!res.ok) throw new Error("Failed to get nonce");
    const data = (await res.json()) as { nonce?: string };
    const nonce = data.nonce;
    if (!nonce) throw new Error("No nonce in response");
    return nonce;
  },

  getSession: async () => getStoredSession(),

  verifyMessage: async ({ message, signature }: SIWEVerifyMessageArgs) => {
    const apiBase = getApiBase();
    if (!apiBase) return false;
    try {
      const siweMessage = new SiweMessage(message);
      const address = siweMessage.address?.toLowerCase();
      const chainId = siweMessage.chainId;
      const res = await fetch(`${apiBase}/api/auth/siwe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token?: string };
      if (data.token) {
        setAuthToken(data.token);
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
