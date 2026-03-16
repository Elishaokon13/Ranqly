/**
 * Frontend API client for Ranqly backend.
 * Set NEXT_PUBLIC_API_URL (e.g. http://localhost:4000) to use the backend; otherwise mock data is used.
 */
import type { Contest, ContestCategory, ContestPhase } from "./mock-data";

const AUTH_TOKEN_KEY = "ranqly_token";

const getBase = (): string => {
  if (typeof window !== "undefined") return process.env.NEXT_PUBLIC_API_URL ?? "";
  return process.env.NEXT_PUBLIC_API_URL ?? "";
};

export function getApiBase(): string {
  return getBase().replace(/\/$/, "");
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBase());
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
}

function getAuthHeaders(): Record<string, string> {
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
  const base = getApiBase();
  if (!base) return [];
  const url = new URL(`${base}/api/contests`);
  if (params?.phase) url.searchParams.set("phase", params.phase);
  if (params?.category) url.searchParams.set("category", params.category);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.offset) url.searchParams.set("offset", String(params.offset));
  const res = await fetch(url.toString(), { cache: "no-store", headers: getAuthHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map(mapBackendContestToFrontend);
}

export async function fetchContest(idOrSlug: string): Promise<Contest | null> {
  const base = getApiBase();
  if (!base) return null;
  const res = await fetch(`${base}/api/contests/${encodeURIComponent(idOrSlug)}`, { cache: "no-store", headers: getAuthHeaders() });
  if (!res.ok) return null;
  const c = await res.json();
  return mapBackendContestToFrontend(c);
}

export async function healthCheck(): Promise<boolean> {
  const base = getApiBase();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

/** GET /api/me/submissions — current user's submissions (requires auth). */
export async function fetchMySubmissions(): Promise<MySubmissionFromApi[] | null> {
  const base = getApiBase();
  if (!base) return null;
  const res = await fetch(`${base}/api/me/submissions`, { cache: "no-store", headers: getAuthHeaders() });
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
  const base = getApiBase();
  if (!base) return null;
  const res = await fetch(`${base}/api/contests/${encodeURIComponent(contestId)}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? { id: data.id } : null;
}
