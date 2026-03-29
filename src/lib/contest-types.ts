/** Shared contest / submission types for the Ranqly UI (backed by API + DB). */

export type ContestPhase =
  | "submission"
  | "scoring"
  | "disputes"
  | "voting"
  | "judging"
  | "finalization"
  | "completed";

export type ContestCategory = "content" | "design" | "dev" | "research" | "other";

export interface Contest {
  id: string;
  title: string;
  description: string;
  organizer: {
    name: string;
    logo: string;
    verified: boolean;
  };
  category: ContestCategory;
  phase: ContestPhase;
  prizePool: string;
  prizeAmount: number;
  currency: string;
  winnersCount: number;
  submissionsCount: number;
  maxSubmissions: number;
  daysRemaining: number;
  startDate: string;
  endDate: string;
  bannerColor: string;
  bannerImage?: string;
  hot: boolean;
  preTge: boolean;
  /** Backend row id (cuid); required for nested API routes when slug is used in URLs. */
  backendId?: string;
}

export const PHASE_LABELS: Record<ContestPhase, string> = {
  submission: "Submissions Open",
  scoring: "Scoring",
  disputes: "Disputes",
  voting: "Community Voting",
  judging: "Expert Judging",
  finalization: "Finalizing",
  completed: "Completed",
};

export const CATEGORY_LABELS: Record<ContestCategory, string> = {
  content: "Content",
  design: "Design",
  dev: "Development",
  research: "Research",
  other: "Other",
};

export type SubmissionStatus = "pending" | "scored" | "won" | "withdrawn";

export interface MySubmission {
  id: string;
  contestId: string;
  title: string;
  workUrl: string;
  description: string;
  status: SubmissionStatus;
  rank?: number;
  submittedAt: string;
}

/** Public contest entry (voting list, leaderboard, judging). */
export interface ContestEntry {
  id: string;
  contestId: string;
  title: string;
  description: string;
  workUrl: string;
  author: string;
}
