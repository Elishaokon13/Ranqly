-- CreateEnum
CREATE TYPE "ContestPhase" AS ENUM ('submission', 'scoring', 'disputes', 'voting', 'judging', 'finalization', 'completed');

-- CreateEnum
CREATE TYPE "ContestCategory" AS ENUM ('content', 'design', 'dev', 'research', 'other');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'scored', 'won', 'withdrawn');

-- CreateEnum
CREATE TYPE "UserPath" AS ENUM ('creator', 'judge', 'organizer');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('plagiarism', 'rule_violation', 'other');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'under_review', 'resolved');

-- CreateEnum
CREATE TYPE "VoteDirection" AS ENUM ('up', 'down');

-- CreateEnum
CREATE TYPE "JudgeInviteStatus" AS ENUM ('pending', 'accepted');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT,
    "email" TEXT,
    "path" "UserPath",
    "name" TEXT,
    "avatarUrl" TEXT,
    "organizerVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "category" "ContestCategory" NOT NULL,
    "phase" "ContestPhase" NOT NULL DEFAULT 'submission',
    "prizePool" TEXT NOT NULL,
    "prizeAmount" DECIMAL(36,18) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "winnersCount" INTEGER NOT NULL,
    "maxSubmissions" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "bannerColor" TEXT,
    "bannerImage" TEXT,
    "hot" BOOLEAN NOT NULL DEFAULT false,
    "preTge" BOOLEAN NOT NULL DEFAULT false,
    "algorithmWeight" DOUBLE PRECISION,
    "rules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "direction" "VoteDirection" NOT NULL,
    "justification" TEXT,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgeAssignment" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "status" "JudgeInviteStatus" NOT NULL DEFAULT 'pending',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JudgeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgeScore" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JudgeScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "filedById" TEXT NOT NULL,
    "type" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "summary" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contest_slug_key" ON "Contest"("slug");

-- CreateIndex
CREATE INDEX "Submission_contestId_idx" ON "Submission"("contestId");

-- CreateIndex
CREATE INDEX "Submission_authorId_idx" ON "Submission"("authorId");

-- CreateIndex
CREATE INDEX "Vote_submissionId_idx" ON "Vote"("submissionId");

-- CreateIndex
CREATE INDEX "Vote_voterId_idx" ON "Vote"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_submissionId_voterId_key" ON "Vote"("submissionId", "voterId");

-- CreateIndex
CREATE INDEX "JudgeAssignment_contestId_idx" ON "JudgeAssignment"("contestId");

-- CreateIndex
CREATE INDEX "JudgeAssignment_userId_idx" ON "JudgeAssignment"("userId");

-- CreateIndex
CREATE INDEX "JudgeAssignment_email_idx" ON "JudgeAssignment"("email");

-- CreateIndex
CREATE UNIQUE INDEX "JudgeAssignment_contestId_userId_key" ON "JudgeAssignment"("contestId", "userId");

-- CreateIndex
CREATE INDEX "JudgeScore_submissionId_idx" ON "JudgeScore"("submissionId");

-- CreateIndex
CREATE INDEX "JudgeScore_judgeId_idx" ON "JudgeScore"("judgeId");

-- CreateIndex
CREATE UNIQUE INDEX "JudgeScore_submissionId_judgeId_key" ON "JudgeScore"("submissionId", "judgeId");

-- CreateIndex
CREATE INDEX "Dispute_contestId_idx" ON "Dispute"("contestId");

-- CreateIndex
CREATE INDEX "Dispute_submissionId_idx" ON "Dispute"("submissionId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- AddForeignKey
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeAssignment" ADD CONSTRAINT "JudgeAssignment_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeAssignment" ADD CONSTRAINT "JudgeAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeScore" ADD CONSTRAINT "JudgeScore_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeScore" ADD CONSTRAINT "JudgeScore_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_filedById_fkey" FOREIGN KEY ("filedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
