/**
 * Public site origin for WalletConnect metadata and server fallbacks.
 */
export function getPublicOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}

export function isReownProjectConfigured(): boolean {
  const id = process.env.NEXT_PUBLIC_PROJECT_ID?.trim();
  return Boolean(id && id !== "00000000000000000000000000000000");
}
