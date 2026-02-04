import { EventEmitter } from 'node:events';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { BlockchainService } from './BlockchainService';
import { SybilDetectionService } from './SybilDetectionService';
import { Server } from 'socket.io';
import { Logger } from '../utils/logger';
import * as crypto from 'node:crypto';

interface VoteCommit {
  voterAddress: string;
  contestId: string;
  submissionId: string;
  commitHash: string;
  timestamp: number;
  phase: 'commit' | 'reveal';
}

interface VoteReveal {
  voterAddress: string;
  contestId: string;
  submissionId: string;
  voteValue: number; // 0 for downvote, 1 for upvote
  salt: string;
  justificationHash: string;
  timestamp: number;
}

interface VotingSession {
  contestId: string;
  phase: 'commit' | 'reveal' | 'closed';
  commitEndTime: number;
  revealEndTime: number;
  totalCommits: number;
  totalReveals: number;
  isActive: boolean;
}

interface VotingResult {
  submissionId: string;
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  netScore: number;
  participationRate: number;
  confidenceScore: number;
}

interface VoteValidation {
  isValid: boolean;
  reason?: string;
  sybilScore?: number;
}

export class VotingService extends EventEmitter {
  private logger: winston.Logger;
  private databaseService: DatabaseService;
  private redisService: RedisService;
  private blockchainService: BlockchainService;
  private sybilDetectionService: SybilDetectionService;
  private io: Server;
  private isInitialized: boolean = false;
  
  // Voting sessions cache
  private votingSessions: Map<string, VotingSession> = new Map();
  
  // Voting parameters
  private readonly MAX_VOTES_PER_USER = 10;
  private readonly MIN_VOTING_POWER = 1;
  private readonly COMMIT_PHASE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REVEAL_PHASE_DURATION = 48 * 60 * 60 * 1000; // 48 hours
  private readonly VOTE_STAKE_AMOUNT = 0.001; // ETH

  constructor() {
    super();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/voting-service.log' })
      ]
    });
  }

  async initialize(
    databaseService: DatabaseService,
    redisService: RedisService,
    blockchainService: BlockchainService,
    sybilDetectionService: SybilDetectionService,
    io: Server
  ): Promise<void> {
    this.databaseService = databaseService;
    this.redisService = redisService;
    this.blockchainService = blockchainService;
    this.sybilDetectionService = sybilDetectionService;
    this.io = io;
    
    this.isInitialized = true;
    this.logger.info('Voting Service initialized');
  }

  async createVotingSession(contestId: string, config: any): Promise<VotingSession> {
    if (!this.isInitialized) {
      throw new Error('VotingService not initialized');
    }

    this.logger.info(`Creating voting session for contest ${contestId}`);

    const now = Date.now();
    const commitEndTime = now + this.COMMIT_PHASE_DURATION;
    const revealEndTime = commitEndTime + this.REVEAL_PHASE_DURATION;

    const session: VotingSession = {
      contestId,
      phase: 'commit',
      commitEndTime,
      revealEndTime,
      totalCommits: 0,
      totalReveals: 0,
      isActive: true
    };

    // Store session in cache and database
    this.votingSessions.set(contestId, session);
    await this.databaseService.storeVotingSession(session);
    await this.redisService.set(`voting_session:${contestId}`, JSON.stringify(session), 3600);

    // Set up phase transition timers
    this.setupPhaseTransitions(contestId, commitEndTime, revealEndTime);

    this.logger.info(`Voting session created for contest ${contestId}`);
    return session;
  }

  async commitVote(
    voterAddress: string,
    contestId: string,
    submissionId: string,
    voteValue: number,
    salt: string,
    justificationHash: string
  ): Promise<{ success: boolean; commitHash: string; message: string }> {
    if (!this.isInitialized) {
      throw new Error('VotingService not initialized');
    }

    this.logger.info(`Committing vote from ${voterAddress} for submission ${submissionId}`);

    try {
      // Validate voting session
      const session = await this.getVotingSession(contestId);
      if (!session) {
        return { success: false, commitHash: '', message: 'Voting session not found' };
      }

      if (session.phase !== 'commit') {
        return { success: false, commitHash: '', message: 'Not in commit phase' };
      }

      if (Date.now() > session.commitEndTime) {
        return { success: false, commitHash: '', message: 'Commit phase has ended' };
      }

      // Validate vote value
      if (voteValue !== 0 && voteValue !== 1) {
        return { success: false, commitHash: '', message: 'Invalid vote value (must be 0 or 1)' };
      }

      // Check if user has already committed for this submission
      const existingCommit = await this.databaseService.getVoteCommit(voterAddress, contestId, submissionId);
      if (existingCommit) {
        return { success: false, commitHash: '', message: 'Already committed for this submission' };
      }

      // Check user's voting power and remaining votes
      const votingPower = await this.getVotingPower(voterAddress);
      if (votingPower < this.MIN_VOTING_POWER) {
        return { success: false, commitHash: '', message: 'Insufficient voting power' };
      }

      const remainingVotes = await this.getRemainingVotes(voterAddress, contestId);
      if (remainingVotes <= 0) {
        return { success: false, commitHash: '', message: 'No remaining votes for this contest' };
      }

      // Generate commit hash
      const commitHash = this.generateCommitHash(voteValue, salt, justificationHash);

      // Store vote commit
      const voteCommit: VoteCommit = {
        voterAddress,
        contestId,
        submissionId,
        commitHash,
        timestamp: Date.now(),
        phase: 'commit'
      };

      await this.databaseService.storeVoteCommit(voteCommit);
      await this.redisService.set(
        `vote_commit:${voterAddress}:${contestId}:${submissionId}`,
        JSON.stringify(voteCommit),
        3600
      );

      // Update session statistics
      session.totalCommits++;
      await this.updateVotingSession(session);

      // Emit real-time update
      this.io.to(`contest-${contestId}`).emit('vote_committed', {
        contestId,
        submissionId,
        voterAddress: this.maskAddress(voterAddress),
        commitHash: commitHash.substring(0, 8) + '...',
        timestamp: Date.now()
      });

      this.logger.info(`Vote committed successfully from ${voterAddress} for submission ${submissionId}`);

      return {
        success: true,
        commitHash,
        message: 'Vote committed successfully'
      };

    } catch (error) {
      this.logger.error(`Error committing vote: ${error}`);
      return { success: false, commitHash: '', message: 'Failed to commit vote' };
    }
  }

  async revealVote(
    voterAddress: string,
    contestId: string,
    submissionId: string,
    voteValue: number,
    salt: string,
    justificationHash: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      throw new Error('VotingService not initialized');
    }

    this.logger.info(`Revealing vote from ${voterAddress} for submission ${submissionId}`);

    try {
      // Validate voting session
      const session = await this.getVotingSession(contestId);
      if (!session) {
        return { success: false, message: 'Voting session not found' };
      }

      if (session.phase !== 'reveal') {
        return { success: false, message: 'Not in reveal phase' };
      }

      if (Date.now() > session.revealEndTime) {
        return { success: false, message: 'Reveal phase has ended' };
      }

      // Get the original commit
      const voteCommit = await this.databaseService.getVoteCommit(voterAddress, contestId, submissionId);
      if (!voteCommit) {
        return { success: false, message: 'No commit found for this vote' };
      }

      // Verify the reveal matches the commit
      const expectedCommitHash = this.generateCommitHash(voteValue, salt, justificationHash);
      if (voteCommit.commitHash !== expectedCommitHash) {
        return { success: false, message: 'Reveal does not match commit' };
      }

      // Check if already revealed
      const existingReveal = await this.databaseService.getVoteReveal(voterAddress, contestId, submissionId);
      if (existingReveal) {
        return { success: false, message: 'Vote already revealed' };
      }

      // Validate vote for sybil detection
      const validation = await this.validateVote(voterAddress, contestId, submissionId, voteValue);
      if (!validation.isValid) {
        // Store invalid vote for analysis
        await this.databaseService.storeInvalidVote({
          voterAddress,
          contestId,
          submissionId,
          voteValue,
          reason: validation.reason,
          sybilScore: validation.sybilScore,
          timestamp: Date.now()
        });

        return { success: false, message: `Vote invalid: ${validation.reason}` };
      }

      // Store vote reveal
      const voteReveal: VoteReveal = {
        voterAddress,
        contestId,
        submissionId,
        voteValue,
        salt,
        justificationHash,
        timestamp: Date.now()
      };

      await this.databaseService.storeVoteReveal(voteReveal);
      await this.redisService.set(
        `vote_reveal:${voterAddress}:${contestId}:${submissionId}`,
        JSON.stringify(voteReveal),
        3600
      );

      // Update submission vote counts
      await this.updateSubmissionVoteCounts(contestId, submissionId, voteValue);

      // Update session statistics
      session.totalReveals++;
      await this.updateVotingSession(session);

      // Emit real-time update
      this.io.to(`contest-${contestId}`).emit('vote_revealed', {
        contestId,
        submissionId,
        voteValue,
        timestamp: Date.now()
      });

      this.logger.info(`Vote revealed successfully from ${voterAddress} for submission ${submissionId}`);

      return {
        success: true,
        message: 'Vote revealed successfully'
      };

    } catch (error) {
      this.logger.error(`Error revealing vote: ${error}`);
      return { success: false, message: 'Failed to reveal vote' };
    }
  }

  async getVotingResults(contestId: string): Promise<VotingResult[]> {
    if (!this.isInitialized) {
      throw new Error('VotingService not initialized');
    }

    try {
      const submissions = await this.databaseService.getContestSubmissions(contestId);
      const results: VotingResult[] = [];

      for (const submissionId of submissions) {
        const upvotes = await this.databaseService.getSubmissionUpvotes(contestId, submissionId);
        const downvotes = await this.databaseService.getSubmissionDownvotes(contestId, submissionId);
        const totalVotes = upvotes + downvotes;
        const netScore = upvotes - downvotes;

        // Calculate participation rate
        const totalEligibleVoters = await this.databaseService.getEligibleVotersCount(contestId);
        const participationRate = totalEligibleVoters > 0 ? totalVotes / totalEligibleVoters : 0;

        // Calculate confidence score based on participation and vote distribution
        const confidenceScore = this.calculateConfidenceScore(upvotes, downvotes, participationRate);

        results.push({
          submissionId,
          upvotes,
          downvotes,
          totalVotes,
          netScore,
          participationRate,
          confidenceScore
        });
      }

      // Sort by net score
      results.sort((a, b) => b.netScore - a.netScore);

      return results;

    } catch (error) {
      this.logger.error(`Error getting voting results: ${error}`);
      throw error;
    }
  }

  async getVotingSession(contestId: string): Promise<VotingSession | null> {
    // Check cache first
    if (this.votingSessions.has(contestId)) {
      return this.votingSessions.get(contestId)!;
    }

    // Check Redis cache
    const cached = await this.redisService.get(`voting_session:${contestId}`);
    if (cached) {
      const session = JSON.parse(cached);
      this.votingSessions.set(contestId, session);
      return session;
    }

    // Check database
    const session = await this.databaseService.getVotingSession(contestId);
    if (session) {
      this.votingSessions.set(contestId, session);
      await this.redisService.set(`voting_session:${contestId}`, JSON.stringify(session), 3600);
      return session;
    }

    return null;
  }

  private async updateVotingSession(session: VotingSession): Promise<void> {
    this.votingSessions.set(session.contestId, session);
    await this.databaseService.updateVotingSession(session);
    await this.redisService.set(`voting_session:${session.contestId}`, JSON.stringify(session), 3600);
  }

  private setupPhaseTransitions(contestId: string, commitEndTime: number, revealEndTime: number): void {
    // Set timer for commit phase end
    const commitTimeout = commitEndTime - Date.now();
    if (commitTimeout > 0) {
      setTimeout(async () => {
        await this.transitionToRevealPhase(contestId);
      }, commitTimeout);
    }

    // Set timer for reveal phase end
    const revealTimeout = revealEndTime - Date.now();
    if (revealTimeout > 0) {
      setTimeout(async () => {
        await this.closeVotingSession(contestId);
      }, revealTimeout);
    }
  }

  private async transitionToRevealPhase(contestId: string): Promise<void> {
    const session = await this.getVotingSession(contestId);
    if (session && session.phase === 'commit') {
      session.phase = 'reveal';
      await this.updateVotingSession(session);

      this.io.to(`contest-${contestId}`).emit('phase_transition', {
        contestId,
        newPhase: 'reveal',
        timestamp: Date.now()
      });

      this.logger.info(`Voting session ${contestId} transitioned to reveal phase`);
    }
  }

  private async closeVotingSession(contestId: string): Promise<void> {
    const session = await this.getVotingSession(contestId);
    if (session && session.phase === 'reveal') {
      session.phase = 'closed';
      session.isActive = false;
      await this.updateVotingSession(session);

      // Calculate final results
      const results = await this.getVotingResults(contestId);
      
      // Store final results
      await this.databaseService.storeFinalVotingResults(contestId, results);

      this.io.to(`contest-${contestId}`).emit('voting_closed', {
        contestId,
        results,
        timestamp: Date.now()
      });

      this.logger.info(`Voting session ${contestId} closed with ${results.length} submissions`);
    }
  }

  private generateCommitHash(voteValue: number, salt: string, justificationHash: string): string {
    const input = `${voteValue}:${salt}:${justificationHash}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private async getVotingPower(voterAddress: string): Promise<number> {
    // Check PoI NFT balance and other factors
    const poiBalance = await this.blockchainService.getPoINFTBalance(voterAddress);
    const onChainActivity = await this.blockchainService.getOnChainActivity(voterAddress);
    
    // Calculate voting power based on PoI NFT and activity
    let votingPower = poiBalance;
    
    // Bonus for on-chain activity
    if (onChainActivity > 10) {
      votingPower += Math.floor(onChainActivity / 10);
    }
    
    return Math.min(votingPower, 10); // Cap at 10
  }

  private async getRemainingVotes(voterAddress: string, contestId: string): Promise<number> {
    const usedVotes = await this.databaseService.getUserVoteCount(voterAddress, contestId);
    const votingPower = await this.getVotingPower(voterAddress);
    
    return Math.max(0, votingPower - usedVotes);
  }

  private async validateVote(
    voterAddress: string,
    contestId: string,
    submissionId: string,
    voteValue: number
  ): Promise<VoteValidation> {
    // Check for sybil behavior
    const sybilResult = await this.sybilDetectionService.detectSybilVoting({
      voterAddress,
      contestId,
      submissionId,
      voteTimestamp: Date.now(),
      ipAddress: 'unknown', // Would be passed from request
      userAgent: 'unknown', // Would be passed from request
      justification: 'unknown' // Would be passed from request
    });

    if (sybilResult.isSybil) {
      return {
        isValid: false,
        reason: 'Sybil behavior detected',
        sybilScore: sybilResult.confidence
      };
    }

    // Check for suspicious voting patterns
    const votingHistory = await this.databaseService.getUserVotingHistory(voterAddress);
    if (votingHistory.length > 0) {
      const recentVotes = votingHistory.filter(vote => 
        Date.now() - vote.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      if (recentVotes.length > 50) {
        return {
          isValid: false,
          reason: 'Excessive voting activity'
        };
      }

      // Check for bot-like patterns
      const sameVoteCount = recentVotes.filter(vote => vote.voteValue === voteValue).length;
      if (sameVoteCount / recentVotes.length > 0.9) {
        return {
          isValid: false,
          reason: 'Suspicious voting pattern detected'
        };
      }
    }

    return { isValid: true };
  }

  private async updateSubmissionVoteCounts(contestId: string, submissionId: string, voteValue: number): Promise<void> {
    if (voteValue === 1) {
      await this.databaseService.incrementSubmissionUpvotes(contestId, submissionId);
    } else {
      await this.databaseService.incrementSubmissionDownvotes(contestId, submissionId);
    }
  }

  private calculateConfidenceScore(upvotes: number, downvotes: number, participationRate: number): number {
    const totalVotes = upvotes + downvotes;
    
    if (totalVotes === 0) {
      return 0;
    }

    // Base confidence on vote distribution
    const voteRatio = Math.min(upvotes, downvotes) / Math.max(upvotes, downvotes);
    const distributionConfidence = 1 - voteRatio;

    // Weight by participation rate
    const participationWeight = Math.min(participationRate * 2, 1);

    // Weight by total votes
    const voteCountWeight = Math.min(totalVotes / 100, 1);

    return (distributionConfidence * 0.5 + participationWeight * 0.3 + voteCountWeight * 0.2);
  }

  private maskAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  async cleanupExpiredVotes(): Promise<void> {
    try {
      const expiredSessions = await this.databaseService.getExpiredVotingSessions();
      
      for (const session of expiredSessions) {
        await this.closeVotingSession(session.contestId);
      }

      this.logger.info(`Cleaned up ${expiredSessions.length} expired voting sessions`);

    } catch (error) {
      this.logger.error(`Error cleaning up expired votes: ${error}`);
    }
  }

  async updateVoteStatistics(): Promise<void> {
    try {
      // Update vote statistics for all active contests
      const activeSessions = await this.databaseService.getActiveVotingSessions();
      
      for (const session of activeSessions) {
        const results = await this.getVotingResults(session.contestId);
        await this.databaseService.updateVoteStatistics(session.contestId, results);
      }

      this.logger.info(`Updated vote statistics for ${activeSessions.length} active sessions`);

    } catch (error) {
      this.logger.error(`Error updating vote statistics: ${error}`);
    }
  }
}
