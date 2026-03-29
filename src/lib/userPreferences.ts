/**
 * User.settings preferences — stored in DB (`User.preferences` JSON) and merged with these defaults.
 * Keys must stay in sync with `backend/src/routes/me.ts` zod schemas.
 */

export type NotificationPrefs = {
  contestUpdates: boolean;
  rankChanges: boolean;
  commentsOnEntries: boolean;
  votingReminders: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  pushRankChanges: boolean;
  pushPhaseTransitions: boolean;
  pushNewContests: boolean;
};

export type PrivacyPrefs = {
  publicProfile: boolean;
  showSubmissions: boolean;
  showContestHistory: boolean;
  showEarnings: boolean;
  showWinRate: boolean;
  showVotesCast: boolean;
  anonymizedResearch: boolean;
  organizerContact: boolean;
};

export type SecurityPrefs = {
  twoFactorEnabled: boolean;
};

export type UserPreferences = {
  notifications: NotificationPrefs;
  privacy: PrivacyPrefs;
  security: SecurityPrefs;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notifications: {
    contestUpdates: true,
    rankChanges: true,
    commentsOnEntries: false,
    votingReminders: true,
    weeklyDigest: false,
    marketingEmails: false,
    pushRankChanges: true,
    pushPhaseTransitions: true,
    pushNewContests: false,
  },
  privacy: {
    publicProfile: true,
    showSubmissions: true,
    showContestHistory: true,
    showEarnings: false,
    showWinRate: true,
    showVotesCast: false,
    anonymizedResearch: false,
    organizerContact: false,
  },
  security: {
    twoFactorEnabled: false,
  },
};

function pickBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

/** Patch shape for PATCH /api/me (partial sections). */
export type UserPreferencesPatch = {
  notifications?: Partial<NotificationPrefs>;
  privacy?: Partial<PrivacyPrefs>;
  security?: Partial<SecurityPrefs>;
};

export function normalizeUserPreferences(raw: unknown): UserPreferences {
  const d = DEFAULT_USER_PREFERENCES;
  const root = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const n = root.notifications && typeof root.notifications === "object" && !Array.isArray(root.notifications)
    ? (root.notifications as Record<string, unknown>)
    : {};
  const p = root.privacy && typeof root.privacy === "object" && !Array.isArray(root.privacy)
    ? (root.privacy as Record<string, unknown>)
    : {};
  const s = root.security && typeof root.security === "object" && !Array.isArray(root.security)
    ? (root.security as Record<string, unknown>)
    : {};

  return {
    notifications: {
      contestUpdates: pickBool(n.contestUpdates, d.notifications.contestUpdates),
      rankChanges: pickBool(n.rankChanges, d.notifications.rankChanges),
      commentsOnEntries: pickBool(n.commentsOnEntries, d.notifications.commentsOnEntries),
      votingReminders: pickBool(n.votingReminders, d.notifications.votingReminders),
      weeklyDigest: pickBool(n.weeklyDigest, d.notifications.weeklyDigest),
      marketingEmails: pickBool(n.marketingEmails, d.notifications.marketingEmails),
      pushRankChanges: pickBool(n.pushRankChanges, d.notifications.pushRankChanges),
      pushPhaseTransitions: pickBool(n.pushPhaseTransitions, d.notifications.pushPhaseTransitions),
      pushNewContests: pickBool(n.pushNewContests, d.notifications.pushNewContests),
    },
    privacy: {
      publicProfile: pickBool(p.publicProfile, d.privacy.publicProfile),
      showSubmissions: pickBool(p.showSubmissions, d.privacy.showSubmissions),
      showContestHistory: pickBool(p.showContestHistory, d.privacy.showContestHistory),
      showEarnings: pickBool(p.showEarnings, d.privacy.showEarnings),
      showWinRate: pickBool(p.showWinRate, d.privacy.showWinRate),
      showVotesCast: pickBool(p.showVotesCast, d.privacy.showVotesCast),
      anonymizedResearch: pickBool(p.anonymizedResearch, d.privacy.anonymizedResearch),
      organizerContact: pickBool(p.organizerContact, d.privacy.organizerContact),
    },
    security: {
      twoFactorEnabled: pickBool(s.twoFactorEnabled, d.security.twoFactorEnabled),
    },
  };
}
