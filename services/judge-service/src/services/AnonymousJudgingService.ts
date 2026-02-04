import { EventEmitter } from 'events';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { BlockchainService } from './BlockchainService';
import winston from 'winston';
import crypto from 'crypto';

interface JudgeProfile {
  judgeId: string;
  address: string;
  expertise: string[];
  experience: number;
  reputation: number;
  totalJudgments: number;
  accuracy: number;
  isActive: boolean;
  isAnonymous: boolean;
  createdAt: number;
}

interface JudgingSession {
  sessionId: string;
  contestId: string;
  submissionIds: string[];
  assignedJudges: string[];
  judgingCriteria: JudgingCriteria[];
  deadline: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'expired';
  createdAt: number;
  completedAt?: number;
}

interface JudgingCriteria {
  criterionId: string;
  name: string;
  description: string;
  weight: number;
  scale: {
    min: number;
    max: number;
    step: number;
  };
}

interface JudgeEvaluation {
  judgeId: string;
  submissionId: string;
  scores: {
    [criterionId: string]: number;
  };
  comments: {
    [criterionId: string]: string;
  };
  overallScore: number;
  timestamp: number;
}

interface FinalJudgingResult {
  submissionId: string;
  finalScore: number;
  judgeScores: {
    [judgeId: string]: number;
  };
  consensus: number;
  confidence: number;
  breakdown: {
    [criterionId: string]: {
      averageScore: number;
      weight: number;
      weightedScore: number;
    };
  };
}

interface JudgeAssignment {
  judgeId: string;
  submissionIds: string[];
  assignmentTime: number;
  deadline: number;
}

export class AnonymousJudgingService extends EventEmitter {
  private logger: winston.Logger;
  private databaseService: DatabaseService;
  private redisService: RedisService;
  private blockchainService: BlockchainService;
  private isInitialized: boolean = false;
  
  // Judge pool management
  private activeJudges: Map<string, JudgeProfile> = new Map();
  private judgingSessions: Map<string, JudgingSession> = new Map();
  
  // Configuration
  private readonly MIN_JUDGES_PER_CONTEST = 3;
  private readonly MAX_JUDGES_PER_CONTEST = 7;
  private readonly JUDGING_TIMEOUT = 72 * 60 * 60 * 1000; // 72 hours
  private readonly MIN_REPUTATION_THRESHOLD = 0.7;
  private readonly JUDGE_ASSIGNMENT_ALGORITHM = 'balanced'; // balanced, random, expertise

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
        new winston.transports.File({ filename: 'logs/anonymous-judging.log' })
      ]
    });
  }

  async initialize(
    databaseService: DatabaseService,
    redisService: RedisService,
    blockchainService: BlockchainService
  ): Promise<void> {
    this.databaseService = databaseService;
    this.redisService = redisService;
    this.blockchainService = blockchainService;
    
    // Load active judges from database
    await this.loadActiveJudges();
    
    this.isInitialized = true;
    this.logger.info('Anonymous Judging Service initialized');
  }

  async createJudgingSession(
    contestId: string,
    submissionIds: string[],
    criteria: JudgingCriteria[]
  ): Promise<JudgingSession> {
    if (!this.isInitialized) {
      throw new Error('AnonymousJudgingService not initialized');
    }

    this.logger.info(`Creating judging session for contest ${contestId} with ${submissionIds.length} submissions`);

    const sessionId = this.generateSessionId();
    const deadline = Date.now() + this.JUDGING_TIMEOUT;

    const session: JudgingSession = {
      sessionId,
      contestId,
      submissionIds,
      assignedJudges: [],
      judgingCriteria: criteria,
      deadline,
      status: 'assigned',
      createdAt: Date.now()
    };

    // Store session
    this.judgingSessions.set(sessionId, session);
    await this.databaseService.storeJudgingSession(session);
    await this.redisService.set(`judging_session:${sessionId}`, JSON.stringify(session), 3600);

    this.logger.info(`Judging session ${sessionId} created for contest ${contestId}`);
    return session;
  }

  async assignJudgesToSession(sessionId: string): Promise<JudgeAssignment[]> {
    const session = this.judgingSessions.get(sessionId);
    if (!session) {
      throw new Error('Judging session not found');
    }

    this.logger.info(`Assigning judges to session ${sessionId}`);

    // Get eligible judges
    const eligibleJudges = await this.getEligibleJudges(session.contestId, session.submissionIds.length);
    
    if (eligibleJudges.length < this.MIN_JUDGES_PER_CONTEST) {
      throw new Error(`Insufficient eligible judges (${eligibleJudges.length}/${this.MIN_JUDGES_PER_CONTEST})`);
    }

    // Assign judges based on algorithm
    const assignments = this.assignJudges(
      eligibleJudges,
      session.submissionIds,
      session.deadline
    );

    // Update session
    session.assignedJudges = assignments.map(a => a.judgeId);
    session.status = 'in_progress';
    await this.updateJudgingSession(session);

    // Store assignments
    for (const assignment of assignments) {
      await this.databaseService.storeJudgeAssignment(assignment);
      await this.redisService.set(
        `judge_assignment:${assignment.judgeId}:${sessionId}`,
        JSON.stringify(assignment),
        3600
      );
    }

    this.logger.info(`Assigned ${assignments.length} judges to session ${sessionId}`);
    return assignments;
  }

  async submitJudgeEvaluation(
    judgeId: string,
    sessionId: string,
    submissionId: string,
    scores: { [criterionId: string]: number },
    comments: { [criterionId: string]: string }
  ): Promise<{ success: boolean; message: string }> {
    if (!this.isInitialized) {
      throw new Error('AnonymousJudgingService not initialized');
    }

    this.logger.info(`Judge ${judgeId} submitting evaluation for submission ${submissionId}`);

    try {
      // Validate session
      const session = this.judgingSessions.get(sessionId);
      if (!session) {
        return { success: false, message: 'Judging session not found' };
      }

      if (session.status !== 'in_progress') {
        return { success: false, message: 'Judging session is not active' };
      }

      if (Date.now() > session.deadline) {
        return { success: false, message: 'Judging deadline has passed' };
      }

      // Validate judge assignment
      if (!session.assignedJudges.includes(judgeId)) {
        return { success: false, message: 'Judge not assigned to this session' };
      }

      // Validate submission
      if (!session.submissionIds.includes(submissionId)) {
        return { success: false, message: 'Submission not in this session' };
      }

      // Validate scores
      const validation = this.validateEvaluation(session.judgingCriteria, scores);
      if (!validation.isValid) {
        return { success: false, message: validation.message };
      }

      // Calculate overall score
      const overallScore = this.calculateOverallScore(session.judgingCriteria, scores);

      // Create evaluation
      const evaluation: JudgeEvaluation = {
        judgeId,
        submissionId,
        scores,
        comments,
        overallScore,
        timestamp: Date.now()
      };

      // Store evaluation
      await this.databaseService.storeJudgeEvaluation(evaluation);
      await this.redisService.set(
        `judge_evaluation:${judgeId}:${submissionId}`,
        JSON.stringify(evaluation),
        3600
      );

      // Check if session is complete
      await this.checkSessionCompletion(sessionId);

      this.logger.info(`Evaluation submitted successfully for submission ${submissionId}`);

      return {
        success: true,
        message: 'Evaluation submitted successfully'
      };

    } catch (error) {
      this.logger.error(`Error submitting evaluation: ${error}`);
      return { success: false, message: 'Failed to submit evaluation' };
    }
  }

  async getFinalResults(sessionId: string): Promise<FinalJudgingResult[]> {
    const session = this.judgingSessions.get(sessionId);
    if (!session) {
      throw new Error('Judging session not found');
    }

    if (session.status !== 'completed') {
      throw new Error('Judging session not completed');
    }

    this.logger.info(`Calculating final results for session ${sessionId}`);

    const results: FinalJudgingResult[] = [];

    for (const submissionId of session.submissionIds) {
      const evaluations = await this.databaseService.getSubmissionEvaluations(sessionId, submissionId);
      
      if (evaluations.length === 0) {
        continue;
      }

      const result = this.calculateFinalResult(session.judgingCriteria, evaluations, submissionId);
      results.push(result);
    }

    // Sort by final score
    results.sort((a, b) => b.finalScore - a.finalScore);

    this.logger.info(`Final results calculated for ${results.length} submissions`);
    return results;
  }

  async getJudgeStatistics(judgeId: string): Promise<any> {
    try {
      const stats = await this.databaseService.getJudgeStatistics(judgeId);
      
      return {
        judgeId,
        totalEvaluations: stats.totalEvaluations,
        averageAccuracy: stats.averageAccuracy,
        reputation: stats.reputation,
        expertise: stats.expertise,
        completedSessions: stats.completedSessions,
        averageCompletionTime: stats.averageCompletionTime,
        lastActive: stats.lastActive
      };

    } catch (error) {
      this.logger.error(`Error getting judge statistics: ${error}`);
      throw error;
    }
  }

  async registerJudge(
    address: string,
    expertise: string[],
    isAnonymous: boolean = true
  ): Promise<{ success: boolean; judgeId: string; message: string }> {
    try {
      // Validate address
      if (!await this.blockchainService.isAddressValid(address)) {
        return { success: false, judgeId: '', message: 'Invalid address' };
      }

      // Check if judge already exists
      const existingJudge = await this.databaseService.getJudgeByAddress(address);
      if (existingJudge) {
        return { success: false, judgeId: '', message: 'Judge already registered' };
      }

      // Generate judge ID
      const judgeId = this.generateJudgeId(address, isAnonymous);

      // Create judge profile
      const judgeProfile: JudgeProfile = {
        judgeId,
        address,
        expertise,
        experience: 0,
        reputation: 0.5, // Initial reputation
        totalJudgments: 0,
        accuracy: 0.0,
        isActive: true,
        isAnonymous,
        createdAt: Date.now()
      };

      // Store judge profile
      await this.databaseService.storeJudgeProfile(judgeProfile);
      this.activeJudges.set(judgeId, judgeProfile);

      this.logger.info(`Judge ${judgeId} registered successfully`);

      return {
        success: true,
        judgeId,
        message: 'Judge registered successfully'
      };

    } catch (error) {
      this.logger.error(`Error registering judge: ${error}`);
      return { success: false, judgeId: '', message: 'Failed to register judge' };
    }
  }

  private async loadActiveJudges(): Promise<void> {
    try {
      const judges = await this.databaseService.getActiveJudges();
      
      for (const judge of judges) {
        this.activeJudges.set(judge.judgeId, judge);
      }

      this.logger.info(`Loaded ${judges.length} active judges`);

    } catch (error) {
      this.logger.error(`Error loading active judges: ${error}`);
      throw error;
    }
  }

  private async getEligibleJudges(contestId: string, submissionCount: number): Promise<JudgeProfile[]> {
    const eligibleJudges: JudgeProfile[] = [];

    for (const [judgeId, judge] of this.activeJudges) {
      // Check if judge meets minimum requirements
      if (!judge.isActive || judge.reputation < this.MIN_REPUTATION_THRESHOLD) {
        continue;
      }

      // Check if judge is available
      const isAvailable = await this.isJudgeAvailable(judgeId, contestId);
      if (!isAvailable) {
        continue;
      }

      eligibleJudges.push(judge);
    }

    // Sort by reputation and experience
    eligibleJudges.sort((a, b) => {
      const scoreA = a.reputation * 0.7 + (a.experience / 100) * 0.3;
      const scoreB = b.reputation * 0.7 + (b.experience / 100) * 0.3;
      return scoreB - scoreA;
    });

    // Limit to maximum judges
    return eligibleJudges.slice(0, this.MAX_JUDGES_PER_CONTEST);
  }

  private async isJudgeAvailable(judgeId: string, contestId: string): Promise<boolean> {
    // Check if judge is already assigned to this contest
    const existingAssignment = await this.databaseService.getJudgeAssignment(judgeId, contestId);
    if (existingAssignment) {
      return false;
    }

    // Check if judge has too many active assignments
    const activeAssignments = await this.databaseService.getJudgeActiveAssignments(judgeId);
    if (activeAssignments.length >= 3) { // Max 3 concurrent assignments
      return false;
    }

    return true;
  }

  private assignJudges(
    eligibleJudges: JudgeProfile[],
    submissionIds: string[],
    deadline: number
  ): JudgeAssignment[] {
    const assignments: JudgeAssignment[] = [];
    const judgesPerSubmission = Math.ceil(eligibleJudges.length / submissionIds.length);

    // Distribute judges across submissions
    for (let i = 0; i < eligibleJudges.length; i++) {
      const judge = eligibleJudges[i];
      const submissionIndex = i % submissionIds.length;
      const submissionId = submissionIds[submissionIndex];

      // Find existing assignment for this judge or create new one
      let assignment = assignments.find(a => a.judgeId === judge.judgeId);
      
      if (!assignment) {
        assignment = {
          judgeId: judge.judgeId,
          submissionIds: [],
          assignmentTime: Date.now(),
          deadline
        };
        assignments.push(assignment);
      }

      assignment.submissionIds.push(submissionId);
    }

    return assignments;
  }

  private validateEvaluation(
    criteria: JudgingCriteria[],
    scores: { [criterionId: string]: number }
  ): { isValid: boolean; message: string } {
    // Check if all criteria are scored
    for (const criterion of criteria) {
      if (!(criterion.criterionId in scores)) {
        return {
          isValid: false,
          message: `Missing score for criterion: ${criterion.name}`
        };
      }

      const score = scores[criterion.criterionId];
      if (score < criterion.scale.min || score > criterion.scale.max) {
        return {
          isValid: false,
          message: `Score for ${criterion.name} must be between ${criterion.scale.min} and ${criterion.scale.max}`
        };
      }
    }

    return { isValid: true, message: '' };
  }

  private calculateOverallScore(
    criteria: JudgingCriteria[],
    scores: { [criterionId: string]: number }
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const criterion of criteria) {
      const score = scores[criterion.criterionId];
      const normalizedScore = (score - criterion.scale.min) / (criterion.scale.max - criterion.scale.min);
      
      totalWeightedScore += normalizedScore * criterion.weight;
      totalWeight += criterion.weight;
    }

    return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
  }

  private calculateFinalResult(
    criteria: JudgingCriteria[],
    evaluations: JudgeEvaluation[],
    submissionId: string
  ): FinalJudgingResult {
    const judgeScores: { [judgeId: string]: number } = {};
    const breakdown: { [criterionId: string]: { averageScore: number; weight: number; weightedScore: number } } = {};

    // Calculate average scores for each criterion
    for (const criterion of criteria) {
      const scores = evaluations.map(e => e.scores[criterion.criterionId] || 0);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      breakdown[criterion.criterionId] = {
        averageScore,
        weight: criterion.weight,
        weightedScore: averageScore * criterion.weight
      };
    }

    // Calculate final score
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const finalScore = Object.values(breakdown).reduce((sum, b) => sum + b.weightedScore, 0) / totalWeight;

    // Calculate judge scores and consensus
    for (const evaluation of evaluations) {
      judgeScores[evaluation.judgeId] = evaluation.overallScore;
    }

    const judgeScoreValues = Object.values(judgeScores);
    const consensus = this.calculateConsensus(judgeScoreValues);
    const confidence = this.calculateConfidence(judgeScoreValues, consensus);

    return {
      submissionId,
      finalScore,
      judgeScores,
      consensus,
      confidence,
      breakdown
    };
  }

  private calculateConsensus(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    // Calculate standard deviation as a measure of consensus
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consensus score (0-1, higher is better)
    return Math.max(0, 1 - (stdDev / 100));
  }

  private calculateConfidence(scores: number[], consensus: number): number {
    if (scores.length === 0) return 0;
    
    // Confidence based on number of judges and consensus
    const judgeFactor = Math.min(scores.length / this.MAX_JUDGES_PER_CONTEST, 1);
    return (judgeFactor * 0.5 + consensus * 0.5);
  }

  private async checkSessionCompletion(sessionId: string): Promise<void> {
    const session = this.judgingSessions.get(sessionId);
    if (!session) return;

    // Check if all submissions have been evaluated by all assigned judges
    const allEvaluations = await this.databaseService.getSessionEvaluations(sessionId);
    const requiredEvaluations = session.assignedJudges.length * session.submissionIds.length;

    if (allEvaluations.length >= requiredEvaluations) {
      session.status = 'completed';
      session.completedAt = Date.now();
      await this.updateJudgingSession(session);

      // Calculate and store final results
      const finalResults = await this.getFinalResults(sessionId);
      await this.databaseService.storeFinalJudgingResults(sessionId, finalResults);

      this.logger.info(`Judging session ${sessionId} completed`);

      // Emit completion event
      this.emit('sessionCompleted', {
        sessionId,
        contestId: session.contestId,
        results: finalResults
      });
    }
  }

  private async updateJudgingSession(session: JudgingSession): Promise<void> {
    this.judgingSessions.set(session.sessionId, session);
    await this.databaseService.updateJudgingSession(session);
    await this.redisService.set(`judging_session:${session.sessionId}`, JSON.stringify(session), 3600);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateJudgeId(address: string, isAnonymous: boolean): string {
    if (isAnonymous) {
      return `judge_${crypto.createHash('sha256').update(address + Date.now()).digest('hex').substring(0, 16)}`;
    } else {
      return `judge_${address.substring(2, 8)}`;
    }
  }
}
