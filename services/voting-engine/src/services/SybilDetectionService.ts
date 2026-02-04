import { EventEmitter } from 'node:events';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';
import { Logger } from '../utils/logger';

interface VotePattern {
  voterAddress: string;
  ipAddress: string;
  userAgent: string;
  voteTimestamp: number;
  justification: string;
  submissionId: string;
  contestId: string;
}

interface SybilCluster {
  clusterId: string;
  voterAddresses: string[];
  confidence: number;
  evidence: string[];
  detectedAt: number;
}

interface SybilDetectionResult {
  isSybil: boolean;
  confidence: number;
  evidence: string[];
  clusterId?: string;
  similarVoters?: string[];
}

export class SybilDetectionService extends EventEmitter {
  private logger: winston.Logger;
  private databaseService: DatabaseService;
  private redisService: RedisService;
  private isInitialized: boolean = false;
  
  // Detection parameters
  private readonly SIMILARITY_THRESHOLD = 0.85;
  private readonly CLUSTER_SIZE_THRESHOLD = 3;
  private readonly TIME_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly IP_CLUSTER_THRESHOLD = 5;
  
  // Machine learning models (simplified)
  private justificationSimilarityModel: any;
  private behaviorPatternModel: any;

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
        new winston.transports.File({ filename: 'logs/sybil-detection.log' })
      ]
    });
  }

  async initialize(databaseService: DatabaseService, redisService: RedisService): Promise<void> {
    this.databaseService = databaseService;
    this.redisService = redisService;
    
    // Initialize ML models (simplified - in production would load trained models)
    this.justificationSimilarityModel = await this.loadJustificationModel();
    this.behaviorPatternModel = await this.loadBehaviorModel();
    
    this.isInitialized = true;
    this.logger.info('Sybil Detection Service initialized');
  }

  async detectSybilVoting(votePattern: VotePattern): Promise<SybilDetectionResult> {
    if (!this.isInitialized) {
      throw new Error('SybilDetectionService not initialized');
    }

    this.logger.info(`Detecting sybil voting for ${votePattern.voterAddress}`);

    const evidence: string[] = [];
    let confidence = 0;

    // 1. IP Address clustering
    const ipEvidence = await this.detectIPClustering(votePattern);
    if (ipEvidence.detected) {
      evidence.push(...ipEvidence.evidence);
      confidence += ipEvidence.confidence;
    }

    // 2. Justification similarity analysis
    const justificationEvidence = await this.detectJustificationSimilarity(votePattern);
    if (justificationEvidence.detected) {
      evidence.push(...justificationEvidence.evidence);
      confidence += justificationEvidence.confidence;
    }

    // 3. Behavioral pattern analysis
    const behaviorEvidence = await this.detectBehavioralPatterns(votePattern);
    if (behaviorEvidence.detected) {
      evidence.push(...behaviorEvidence.evidence);
      confidence += behaviorEvidence.confidence;
    }

    // 4. Timing analysis
    const timingEvidence = await this.detectSuspiciousTiming(votePattern);
    if (timingEvidence.detected) {
      evidence.push(...timingEvidence.evidence);
      confidence += timingEvidence.confidence;
    }

    // 5. User agent analysis
    const userAgentEvidence = await this.detectUserAgentPatterns(votePattern);
    if (userAgentEvidence.detected) {
      evidence.push(...userAgentEvidence.evidence);
      confidence += userAgentEvidence.confidence;
    }

    const isSybil = confidence > 0.7; // Threshold for sybil detection
    const result: SybilDetectionResult = {
      isSybil,
      confidence: Math.min(1, confidence),
      evidence
    };

    if (isSybil) {
      this.logger.warn(`Sybil voting detected for ${votePattern.voterAddress}`, {
        confidence,
        evidence,
        votePattern
      });

      // Store sybil detection result
      await this.storeSybilDetection(votePattern.voterAddress, result);
      
      // Emit event for real-time handling
      this.emit('sybilDetected', {
        voterAddress: votePattern.voterAddress,
        result,
        votePattern
      });
    }

    return result;
  }

  private async detectIPClustering(votePattern: VotePattern): Promise<{
    detected: boolean;
    confidence: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    let confidence = 0;

    try {
      // Get recent votes from same IP
      const recentVotes = await this.databaseService.getRecentVotesByIP(
        votePattern.ipAddress,
        this.TIME_WINDOW_MS
      );

      if (recentVotes.length >= this.IP_CLUSTER_THRESHOLD) {
        const uniqueAddresses = new Set(recentVotes.map(v => v.voterAddress));
        
        if (uniqueAddresses.size >= this.CLUSTER_SIZE_THRESHOLD) {
          evidence.push(`Multiple voters from same IP address: ${uniqueAddresses.size} unique addresses`);
          confidence += 0.3;
        }

        // Check for sequential voting patterns
        const sequentialVotes = this.detectSequentialVoting(recentVotes);
        if (sequentialVotes) {
          evidence.push('Sequential voting pattern detected from same IP');
          confidence += 0.2;
        }
      }

      // Check for IP geolocation anomalies
      const geoAnomaly = await this.detectGeoAnomalies(votePattern);
      if (geoAnomaly) {
        evidence.push('Geographic location anomaly detected');
        confidence += 0.1;
      }

    } catch (error) {
      this.logger.error('Error in IP clustering detection:', error);
    }

    return {
      detected: confidence > 0.2,
      confidence,
      evidence
    };
  }

  private async detectJustificationSimilarity(votePattern: VotePattern): Promise<{
    detected: boolean;
    confidence: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    let confidence = 0;

    try {
      // Get recent justifications from the same contest
      const recentJustifications = await this.databaseService.getRecentJustifications(
        votePattern.contestId,
        this.TIME_WINDOW_MS
      );

      // Calculate similarity with other justifications
      for (const justification of recentJustifications) {
        if (justification.voterAddress !== votePattern.voterAddress) {
          const similarity = await this.calculateJustificationSimilarity(
            votePattern.justification,
            justification.justification
          );

          if (similarity > this.SIMILARITY_THRESHOLD) {
            evidence.push(`High similarity with justification from ${justification.voterAddress}`);
            confidence += 0.2;
          }
        }
      }

      // Check for template-like justifications
      const templateScore = this.detectTemplateJustification(votePattern.justification);
      if (templateScore > 0.8) {
        evidence.push('Template-like justification detected');
        confidence += 0.15;
      }

    } catch (error) {
      this.logger.error('Error in justification similarity detection:', error);
    }

    return {
      detected: confidence > 0.2,
      confidence,
      evidence
    };
  }

  private async detectBehavioralPatterns(votePattern: VotePattern): Promise<{
    detected: boolean;
    confidence: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    let confidence = 0;

    try {
      // Get historical voting behavior for this address
      const votingHistory = await this.databaseService.getVotingHistory(votePattern.voterAddress);
      
      if (votingHistory.length > 0) {
        // Check for unusual voting patterns
        const patternAnomaly = this.analyzeVotingPatterns(votingHistory, votePattern);
        if (patternAnomaly) {
          evidence.push('Unusual voting pattern detected');
          confidence += 0.2;
        }

        // Check for rapid voting (bot-like behavior)
        const rapidVoting = this.detectRapidVoting(votingHistory);
        if (rapidVoting) {
          evidence.push('Rapid voting pattern detected (potential bot)');
          confidence += 0.25;
        }

        // Check for consistent voting patterns across contests
        const consistentPattern = this.detectConsistentPatterns(votingHistory);
        if (consistentPattern) {
          evidence.push('Consistent voting pattern across multiple contests');
          confidence += 0.15;
        }
      }

    } catch (error) {
      this.logger.error('Error in behavioral pattern detection:', error);
    }

    return {
      detected: confidence > 0.2,
      confidence,
      evidence
    };
  }

  private async detectSuspiciousTiming(votePattern: VotePattern): Promise<{
    detected: boolean;
    confidence: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    let confidence = 0;

    try {
      // Get recent votes in the same contest
      const recentContestVotes = await this.databaseService.getRecentContestVotes(
        votePattern.contestId,
        this.TIME_WINDOW_MS
      );

      // Check for burst voting patterns
      const burstPattern = this.detectBurstVoting(recentContestVotes, votePattern.voteTimestamp);
      if (burstPattern) {
        evidence.push('Burst voting pattern detected');
        confidence += 0.2;
      }

      // Check for synchronized voting
      const synchronizedVoting = this.detectSynchronizedVoting(recentContestVotes, votePattern.voteTimestamp);
      if (synchronizedVoting) {
        evidence.push('Synchronized voting pattern detected');
        confidence += 0.3;
      }

    } catch (error) {
      this.logger.error('Error in timing analysis:', error);
    }

    return {
      detected: confidence > 0.2,
      confidence,
      evidence
    };
  }

  private async detectUserAgentPatterns(votePattern: VotePattern): Promise<{
    detected: boolean;
    confidence: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    let confidence = 0;

    try {
      // Get recent votes with same user agent
      const sameUserAgentVotes = await this.databaseService.getVotesByUserAgent(
        votePattern.userAgent,
        this.TIME_WINDOW_MS
      );

      if (sameUserAgentVotes.length >= this.CLUSTER_SIZE_THRESHOLD) {
        const uniqueAddresses = new Set(sameUserAgentVotes.map(v => v.voterAddress));
        
        if (uniqueAddresses.size >= this.CLUSTER_SIZE_THRESHOLD) {
          evidence.push(`Multiple voters with identical user agent: ${uniqueAddresses.size} addresses`);
          confidence += 0.25;
        }
      }

      // Check for bot-like user agents
      if (this.isBotUserAgent(votePattern.userAgent)) {
        evidence.push('Bot-like user agent detected');
        confidence += 0.2;
      }

    } catch (error) {
      this.logger.error('Error in user agent analysis:', error);
    }

    return {
      detected: confidence > 0.2,
      confidence,
      evidence
    };
  }

  // Helper methods for pattern detection
  private detectSequentialVoting(votes: any[]): boolean {
    // Sort votes by timestamp
    const sortedVotes = votes.sort((a, b) => a.voteTimestamp - b.voteTimestamp);
    
    // Check for sequential voting within short time intervals
    for (let i = 1; i < sortedVotes.length; i++) {
      const timeDiff = sortedVotes[i].voteTimestamp - sortedVotes[i-1].voteTimestamp;
      if (timeDiff < 60000) { // Less than 1 minute
        return true;
      }
    }
    
    return false;
  }

  private async detectGeoAnomalies(votePattern: VotePattern): Promise<boolean> {
    // In production, this would use IP geolocation services
    // For now, returning false as placeholder
    return false;
  }

  private async calculateJustificationSimilarity(justification1: string, justification2: string): Promise<number> {
    // Simplified similarity calculation using Jaccard similarity
    const words1 = new Set(justification1.toLowerCase().split(/\s+/));
    const words2 = new Set(justification2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private detectTemplateJustification(justification: string): number {
    // Simple template detection based on common phrases
    const templatePhrases = [
      'great submission',
      'excellent work',
      'well done',
      'good job',
      'amazing',
      'fantastic',
      'love it',
      'awesome'
    ];
    
    const lowerJustification = justification.toLowerCase();
    let templateScore = 0;
    
    for (const phrase of templatePhrases) {
      if (lowerJustification.includes(phrase)) {
        templateScore += 0.1;
      }
    }
    
    return Math.min(1, templateScore);
  }

  private analyzeVotingPatterns(history: any[], currentVote: VotePattern): boolean {
    // Analyze patterns in voting behavior
    // This is a simplified implementation
    return false;
  }

  private detectRapidVoting(history: any[]): boolean {
    if (history.length < 3) return false;
    
    const recentVotes = history.slice(-3);
    const timeSpan = recentVotes[recentVotes.length - 1].voteTimestamp - recentVotes[0].voteTimestamp;
    
    // If 3 votes within 5 minutes, consider it rapid voting
    return timeSpan < 5 * 60 * 1000;
  }

  private detectConsistentPatterns(history: any[]): boolean {
    // Check for consistent voting patterns across contests
    // This is a simplified implementation
    return false;
  }

  private detectBurstVoting(votes: any[], currentTimestamp: number): boolean {
    // Check for burst voting within a short time window
    const windowStart = currentTimestamp - 10 * 60 * 1000; // 10 minutes
    const recentVotes = votes.filter(v => v.voteTimestamp >= windowStart);
    
    return recentVotes.length >= 10; // 10+ votes in 10 minutes
  }

  private detectSynchronizedVoting(votes: any[], currentTimestamp: number): boolean {
    // Check for votes that are very close in time (within 1 minute)
    const windowStart = currentTimestamp - 60 * 1000; // 1 minute
    const recentVotes = votes.filter(v => v.voteTimestamp >= windowStart);
    
    return recentVotes.length >= 5; // 5+ votes within 1 minute
  }

  private isBotUserAgent(userAgent: string): boolean {
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'python', 'curl', 'wget', 'postman'
    ];
    
    const lowerUserAgent = userAgent.toLowerCase();
    return botPatterns.some(pattern => lowerUserAgent.includes(pattern));
  }

  // Machine learning model loading (simplified)
  private async loadJustificationModel(): Promise<any> {
    // In production, this would load a trained ML model
    return null;
  }

  private async loadBehaviorModel(): Promise<any> {
    // In production, this would load a trained ML model
    return null;
  }

  // Storage and retrieval methods
  private async storeSybilDetection(voterAddress: string, result: SybilDetectionResult): Promise<void> {
    try {
      await this.databaseService.storeSybilDetection({
        voterAddress,
        confidence: result.confidence,
        evidence: result.evidence,
        detectedAt: Date.now()
      });
      
      // Cache the result
      await this.redisService.set(`sybil:${voterAddress}`, JSON.stringify(result), 3600);
    } catch (error) {
      this.logger.error('Error storing sybil detection:', error);
    }
  }

  async getSybilDetection(voterAddress: string): Promise<SybilDetectionResult | null> {
    try {
      // Try cache first
      const cached = await this.redisService.get(`sybil:${voterAddress}`);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Fallback to database
      const stored = await this.databaseService.getSybilDetection(voterAddress);
      if (stored) {
        return {
          isSybil: stored.confidence > 0.7,
          confidence: stored.confidence,
          evidence: stored.evidence
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error retrieving sybil detection:', error);
      return null;
    }
  }

  // Scheduled detection run
  async runDetection(): Promise<void> {
    try {
      this.logger.info('Running scheduled sybil detection');
      
      // Get recent votes that haven't been analyzed
      const recentVotes = await this.databaseService.getUnanalyzedVotes(this.TIME_WINDOW_MS);
      
      for (const vote of recentVotes) {
        const result = await this.detectSybilVoting(vote);
        if (result.isSybil) {
          // Mark vote as analyzed and potentially flagged
          await this.databaseService.markVoteAnalyzed(vote.id, result);
        }
      }
      
      this.logger.info(`Sybil detection completed. Analyzed ${recentVotes.length} votes`);
    } catch (error) {
      this.logger.error('Error in scheduled sybil detection:', error);
    }
  }
}
