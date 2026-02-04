export interface BetaUser {
  id: string;
  email: string;
  walletAddress: string;
  username: string;
  fullName: string;
  status: BetaUserStatus;
  tier: BetaUserTier;
  invitationCode: string;
  invitedBy?: string;
  onboardingCompleted: boolean;
  profile: BetaUserProfile;
  preferences: BetaUserPreferences;
  statistics: BetaUserStatistics;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  betaStartDate: Date;
  betaEndDate: Date;
}

export enum BetaUserStatus {
  PENDING = 'pending',
  INVITED = 'invited',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

export enum BetaUserTier {
  EARLY_ACCESS = 'early_access',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  VIP = 'vip'
}

export interface BetaUserProfile {
  bio?: string;
  avatar?: string;
  location?: string;
  timezone?: string;
  website?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  experience: UserExperience;
  interests: string[];
  goals: string[];
}

export enum UserExperience {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface BetaUserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    discord: boolean;
    telegram: boolean;
  };
  privacy: {
    profilePublic: boolean;
    activityPublic: boolean;
    analyticsOptIn: boolean;
  };
  beta: {
    feedbackReminders: boolean;
    featureUpdates: boolean;
    communityUpdates: boolean;
    betaTestingNews: boolean;
  };
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface BetaUserStatistics {
  contestsCreated: number;
  contestsParticipated: number;
  submissionsMade: number;
  votesCast: number;
  feedbackSubmitted: number;
  bugsReported: number;
  suggestionsMade: number;
  hoursActive: number;
  lastLoginAt?: Date;
  streakDays: number;
  achievements: string[];
  badges: string[];
}

export interface BetaUserInvitation {
  id: string;
  email: string;
  invitationCode: string;
  invitedBy: string;
  tier: BetaUserTier;
  expiresAt: Date;
  status: 'pending' | 'used' | 'expired';
  createdAt: Date;
  usedAt?: Date;
}

export interface BetaUserOnboarding {
  userId: string;
  steps: {
    welcome: boolean;
    profileSetup: boolean;
    walletConnection: boolean;
    firstContest: boolean;
    firstVote: boolean;
    feedback: boolean;
    community: boolean;
  };
  currentStep: string;
  completedAt?: Date;
  progress: number; // 0-100
}

export interface BetaUserSession {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

export interface BetaUserActivity {
  id: string;
  userId: string;
  type: BetaUserActivityType;
  action: string;
  details: any;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
  };
}

export enum BetaUserActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CONTEST_CREATE = 'contest_create',
  CONTEST_JOIN = 'contest_join',
  SUBMISSION_CREATE = 'submission_create',
  VOTE_CAST = 'vote_cast',
  FEEDBACK_SUBMIT = 'feedback_submit',
  BUG_REPORT = 'bug_report',
  PROFILE_UPDATE = 'profile_update',
  SETTINGS_UPDATE = 'settings_update'
}

export interface BetaUserAnalytics {
  userId: string;
  period: string; // 'daily', 'weekly', 'monthly'
  date: Date;
  metrics: {
    sessions: number;
    duration: number; // in minutes
    pageViews: number;
    actions: number;
    contestsCreated: number;
    contestsParticipated: number;
    submissionsMade: number;
    votesCast: number;
    feedbackSubmitted: number;
    bugsReported: number;
    satisfaction: number; // 1-5
  };
  trends: {
    engagement: number; // percentage change
    satisfaction: number; // percentage change
    activity: number; // percentage change
  };
}
