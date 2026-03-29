/**
 * Frontend API client for Ranqly backend.
 * Unified server: leave NEXT_PUBLIC_API_URL unset for same-origin /api (browser) and 127.0.0.1 (SSR).
 * Set NEXT_PUBLIC_USE_MOCK_API=true to force mock data and skip backend calls.
 */
import type { Contest, ContestCategory, ContestPhase } from "./mock-data";
import type { UserPreferencesPatch } from "./userPreferences";

const AUTH_TOKEN_KEY = "ranqly_token";

/** Dispatched on `window` after PATCH /api/me succeeds so settings tabs can refetch. */
export const ME_UPDATED_EVENT = "ranqly-me-updated";

/** Full URL for API calls (browser may be relative). */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const explicit = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  if (explicit) return `${explicit}${p}`;
  if (typeof window !== "undefined") return p;
  return `http://127.0.0.1:${process.env.PORT ?? "3000"}${p}`;
}

export function getApiBase(): string {
  const explicit = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  if (explicit) return explicit;
  if (typeof window !== "undefined") return "";
  return `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
}

/** Absolute URL for uploaded assets (e.g. /uploads/avatars/...) when API is on another origin. */
export function publicAssetUrl(relativeOrAbsolute: string | null | undefined): string {
  const p = (relativeOrAbsolute ?? "").trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = getApiBase().replace(/\/$/, "");
  const path = p.startsWith("/") ? p : `/${p}`;
  if (base) return `${base}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}

export function isApiConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API === "true") return false;
  return true;
}

/** Auth token for API requests (set after sign-in via backend). */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event("ranqly-token-change"));
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

interface BackendContest {
  id: string;
  slug: string;
  title: string;
  description: string;
  organizer: { id: string; name: string | null; avatarUrl?: string | null; organizerVerified?: boolean };
  category: string;
  phase: string;
  prizePool: string;
  prizeAmount: string;
  currency: string;
  winnersCount: number;
  maxSubmissions: number | null;
  startDate: string;
  endDate: string;
  bannerColor: string | null;
  bannerImage: string | null;
  hot: boolean;
  preTge: boolean;
  submissionsCount?: number;
}

function mapBackendContestToFrontend(c: BackendContest): Contest {
  const start = new Date(c.startDate);
  const end = new Date(c.endDate);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  return {
    id: c.slug || c.id,
    backendId: c.id,
    title: c.title,
    description: c.description,
    organizer: {
      name: c.organizer?.name ?? "Organizer",
      logo: c.organizer?.avatarUrl ? "" : (c.organizer?.name?.[0] ?? "?"),
      verified: Boolean(c.organizer?.organizerVerified),
    },
    category: c.category as ContestCategory,
    phase: c.phase as ContestPhase,
    prizePool: c.prizePool,
    prizeAmount: Number(c.prizeAmount) || 0,
    currency: c.currency,
    winnersCount: c.winnersCount,
    submissionsCount: c.submissionsCount ?? 0,
    maxSubmissions: c.maxSubmissions ?? 0,
    daysRemaining,
    startDate: c.startDate,
    endDate: c.endDate,
    bannerColor: c.bannerColor ?? "from-primary-500 to-primary-700",
    bannerImage: c.bannerImage ?? undefined,
    hot: c.hot,
    preTge: c.preTge,
  };
}

export async function fetchContests(params?: {
  phase?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<Contest[]> {
  if (!isApiConfigured()) return [];
  const search = new URLSearchParams();
  if (params?.phase) search.set("phase", params.phase);
  if (params?.category) search.set("category", params.category);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const qs = search.toString();
  const url = apiUrl(`/api/contests${qs ? `?${qs}` : ""}`);
  const res = await fetch(url, { cache: "no-store", headers: getAuthHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(mapBackendContestToFrontend);
}

export async function fetchContest(idOrSlug: string): Promise<Contest | null> {
  if (!isApiConfigured()) return null;
  const res = await fetch(apiUrl(`/api/contests/${encodeURIComponent(idOrSlug)}`), {
    cache: "no-store",
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  const c = await res.json();
  return mapBackendContestToFrontend(c);
}

export async function healthCheck(): Promise<boolean> {
  if (!isApiConfigured()) return false;
  try {
    const res = await fetch(apiUrl("/health"), { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** GET /api/me/submissions — current user's submissions (requires auth). */
export async function fetchMySubmissions(): Promise<MySubmissionFromApi[] | null> {
  if (!isApiConfigured()) return null;
  const res = await fetch(apiUrl("/api/me/submissions"), { cache: "no-store", headers: getAuthHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export interface MySubmissionFromApi {
  id: string;
  contestId: string;
  title: string;
  workUrl: string;
  description: string;
  status: string;
  rank?: number | null;
  createdAt: string;
  contest?: { id: string; slug: string; title: string; phase: string };
}

/** POST /api/contests/:contestId/submissions — create submission (requires auth). contestId = backend id (cuid). */
export async function createSubmission(
  contestId: string,
  body: { title: string; workUrl: string; description: string }
): Promise<{ id: string } | null> {
  if (!isApiConfigured()) return null;
  const res = await fetch(apiUrl(`/api/contests/${encodeURIComponent(contestId)}/submissions`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? { id: data.id } : null;
}

export interface AuthMeUser {
  id: string;
  walletAddress: string | null;
  email: string | null;
  path: string | null;
  name: string | null;
  avatarUrl: string | null;
  preferences?: unknown;
  organizerVerified?: boolean;
}

/** GET /api/auth/me */
export async function fetchAuthMe(): Promise<AuthMeUser | null> {
  if (!isApiConfigured()) return null;
  const res = await fetch(apiUrl("/api/auth/me"), { cache: "no-store", headers: getAuthHeaders() });
  if (!res.ok) return null;
  return (await res.json()) as AuthMeUser;
}

async function readFetchErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const j = (await res.json()) as { error?: unknown; message?: unknown; details?: unknown };
    if (typeof j.error === "string") return j.error;
    if (typeof j.message === "string") return j.message;
    if (typeof j.details === "string") return j.details;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** POST /api/me/avatar (multipart). Throws Error with server message on failure. */
export async function uploadProfileAvatar(file: File): Promise<{ avatarUrl: string }> {
  if (!isApiConfigured()) throw new Error("API is not configured.");
  const body = new FormData();
  body.append("avatar", file);
  const res = await fetch(apiUrl("/api/me/avatar"), {
    method: "POST",
    headers: getAuthHeaders(),
    body,
  });
  if (!res.ok) {
    const msg = await readFetchErrorMessage(res, `Upload failed (${res.status})`);
    throw new Error(msg);
  }
  const out = (await res.json()) as { avatarUrl: string };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ME_UPDATED_EVENT));
  }
  return out;
}

/** PATCH /api/me. Throws Error with server message on failure. */
export async function patchMyProfile(updates: {
  name?: string;
  email?: string;
  avatarUrl?: string;
  preferences?: UserPreferencesPatch;
}): Promise<AuthMeUser> {
  if (!isApiConfigured()) throw new Error("API is not configured.");
  const res = await fetch(apiUrl("/api/me"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const msg = await readFetchErrorMessage(res, `Save failed (${res.status})`);
    throw new Error(msg);
  }
  const user = (await res.json()) as AuthMeUser;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ME_UPDATED_EVENT));
  }
  return user;
}

/** GET /api/me/export — triggers JSON download in the browser. */
export async function downloadMyAccountExport(): Promise<void> {
  if (!isApiConfigured()) throw new Error("API is not configured.");
  const res = await fetch(apiUrl("/api/me/export"), { cache: "no-store", headers: getAuthHeaders() });
  if (!res.ok) {
    const msg = await readFetchErrorMessage(res, `Export failed (${res.status})`);
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ranqly-account-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** POST /api/me/delete-account — irreversible. Caller should sign out after success. */
export async function deleteMyAccount(): Promise<void> {
  if (!isApiConfigured()) throw new Error("API is not configured.");
  const res = await fetch(apiUrl("/api/me/delete-account"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
  });
  if (!res.ok) {
    const msg = await readFetchErrorMessage(res, `Delete failed (${res.status})`);
    throw new Error(msg);
  }
}

