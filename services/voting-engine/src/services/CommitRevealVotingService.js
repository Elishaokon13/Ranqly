/**
 * Ranqly Commit-Reveal Voting Service
 * Implements the exact voting methodology from the whitepaper:
 * - PoI NFT gated voting (one vote per NFT holder)
 * - K upvotes and L downvotes per voter (default K=5, L=2)
 * - Mandatory justifications for each vote
 * - Reason codes for accountability
 * - Cluster detection for sybil prevention
 * - Commit-reveal scheme to prevent herding
 */

const crypto = require('crypto');
const { ethers } = require('ethers');

class CommitRevealVotingService {
    constructor() {
        this.votingSessions = new Map(); // contestId -> VotingSession
        this.voteCommitments = new Map(); // contestId -> Map<address, VoteCommitment>
        this.voteReveals = new Map(); // contestId -> Map<address, VoteReveal>
        this.sybilDetection = new Map(); // contestId -> SybilDetectionData
        
        // Vote reason codes as per whitepaper
        this.voteReasons = {
            // Upvote reasons
            'U1': 'Unique insight',
            'U2': 'High quality content', 
            'U3': 'Original approach',
            'U4': 'Well researched',
            'U5': 'Clear explanation',
            // Downvote reasons
            'D1': 'Low effort',
            'D2': 'Overhyped',
            'D3': 'Off-topic',
            'D4': 'Plagiarized',
            'D5': 'Poor quality'
        };
    }

    /**
     * Create a new voting session for a contest
     */
    createVotingSession(contestId, config) {
        const session = {
            contestId,
            poiNFTContract: config.poiNFTContract || '0x742d35Cc6634C0532925a3b8D5a0F6b2e1E8C1e',
            entryIds: config.entryIds || [],
            maxUpvotes: config.maxUpvotes || 5,
            maxDownvotes: config.maxDownvotes || 2,
            commitPhaseStart: new Date(config.commitPhaseStart || Date.now()),
            commitPhaseEnd: new Date(config.commitPhaseEnd || Date.now() + 24 * 60 * 60 * 1000),
            revealPhaseStart: new Date(config.revealPhaseStart || Date.now() + 24 * 60 * 60 * 1000),
            revealPhaseEnd: new Date(config.revealPhaseEnd || Date.now() + 48 * 60 * 60 * 1000),
            isActive: true,
            totalVoters: 0,
            voteResults: new Map(), // entryId -> { upvotes: 0, downvotes: 0, netVotes: 0 }
            justifications: new Map(), // entryId -> [justifications]
            reasonCounts: new Map() // entryId -> Map<reason, count>
        };

        // Initialize vote results for each entry
        session.entryIds.forEach(entryId => {
            session.voteResults.set(entryId, {
                upvotes: 0,
                downvotes: 0,
                netVotes: 0
            });
            session.justifications.set(entryId, []);
            session.reasonCounts.set(entryId, new Map());
        });

        this.votingSessions.set(contestId, session);
        this.voteCommitments.set(contestId, new Map());
        this.voteReveals.set(contestId, new Map());
        this.sybilDetection.set(contestId, {
            ipAddresses: new Map(),
            votingPatterns: new Map(),
            suspiciousVoters: new Set()
        });

        return session;
    }

    /**
     * Commit votes (commit phase)
     */
    async commitVote(contestId, voterAddress, voteData, ipAddress) {
        const session = this.votingSessions.get(contestId);
        if (!session) {
            throw new Error('Voting session not found');
        }

        const now = new Date();
        if (now < session.commitPhaseStart || now > session.commitPhaseEnd) {
            throw new Error('Commit phase not active');
        }

        // Check if voter already committed
        const commitments = this.voteCommitments.get(contestId);
        if (commitments.has(voterAddress)) {
            throw new Error('Vote already committed');
        }

        // Verify PoI NFT ownership (would check blockchain in production)
        const hasPoINFT = await this.verifyPoINFT(voterAddress, session.poiNFTContract);
        if (!hasPoINFT) {
            throw new Error('PoI NFT required for voting');
        }

        // Validate vote data
        this.validateVoteData(voteData, session);

        // Generate commitment
        const commitment = this.generateCommitment(voterAddress, voteData);
        
        // Store commitment
        commitments.set(voterAddress, {
            commitment,
            timestamp: now,
            ipAddress,
            revealed: false
        });

        // Track for sybil detection
        this.trackVoterForSybilDetection(contestId, voterAddress, ipAddress);

        return commitment;
    }

    /**
     * Reveal votes (reveal phase)
     */
    async revealVote(contestId, voterAddress, revealData) {
        const session = this.votingSessions.get(contestId);
        if (!session) {
            throw new Error('Voting session not found');
        }

        const now = new Date();
        if (now < session.revealPhaseStart || now > session.revealPhaseEnd) {
            throw new Error('Reveal phase not active');
        }

        const commitments = this.voteCommitments.get(contestId);
        const commitment = commitments.get(voterAddress);
        
        if (!commitment) {
            throw new Error('No vote commitment found');
        }
        if (commitment.revealed) {
            throw new Error('Vote already revealed');
        }

        // Verify commitment matches reveal
        const calculatedCommitment = this.generateCommitment(voterAddress, revealData);
        if (calculatedCommitment !== commitment.commitment) {
            throw new Error('Commitment verification failed');
        }

        // Validate reveal data
        this.validateRevealData(revealData, session);

        // Process votes and check for sybil behavior
        const isSybil = this.detectSybilBehavior(contestId, voterAddress, revealData);
        if (isSybil) {
            console.log(`Sybil behavior detected for voter ${voterAddress}`);
            // Mark as suspicious but still process (could be false positive)
        }

        // Process votes
        this.processVotes(session, revealData);

        // Mark as revealed
        commitment.revealed = true;
        this.voteReveals.get(contestId).set(voterAddress, revealData);
        session.totalVoters++;

        return {
            success: true,
            votesProcessed: revealData.votes.length,
            isSybil: isSybil
        };
    }

    /**
     * Generate commitment hash from vote data
     */
    generateCommitment(voterAddress, voteData) {
        const dataToHash = JSON.stringify({
            voterAddress,
            votes: voteData.votes,
            nonce: voteData.nonce,
            timestamp: voteData.timestamp
        });
        
        return crypto.createHash('sha256').update(dataToHash).digest('hex');
    }

    /**
     * Validate vote data during commit phase
     */
    validateVoteData(voteData, session) {
        if (!voteData.votes || !Array.isArray(voteData.votes)) {
            throw new Error('Invalid vote data');
        }

        let upvoteCount = 0;
        let downvoteCount = 0;

        voteData.votes.forEach(vote => {
            if (!vote.entryId || !vote.voteType || !vote.reason || !vote.justification) {
                throw new Error('Incomplete vote data');
            }

            // Validate entry ID
            if (!session.entryIds.includes(vote.entryId)) {
                throw new Error(`Invalid entry ID: ${vote.entryId}`);
            }

            // Validate vote type
            if (vote.voteType !== 1 && vote.voteType !== -1) {
                throw new Error('Invalid vote type');
            }

            // Validate reason code
            if (!this.voteReasons[vote.reason]) {
                throw new Error(`Invalid reason code: ${vote.reason}`);
            }

            // Validate justification length
            if (vote.justification.length < 10) {
                throw new Error('Justification too short');
            }

            // Count vote types
            if (vote.voteType === 1) {
                upvoteCount++;
            } else {
                downvoteCount++;
            }
        });

        // Validate vote limits
        if (upvoteCount > session.maxUpvotes) {
            throw new Error(`Too many upvotes: ${upvoteCount} > ${session.maxUpvotes}`);
        }
        if (downvoteCount > session.maxDownvotes) {
            throw new Error(`Too many downvotes: ${downvoteCount} > ${session.maxDownvotes}`);
        }
    }

    /**
     * Validate reveal data
     */
    validateRevealData(revealData, session) {
        // Same validation as commit phase
        this.validateVoteData(revealData, session);
    }

    /**
     * Process votes and update results
     */
    processVotes(session, revealData) {
        revealData.votes.forEach(vote => {
            const entryId = vote.entryId;
            const voteType = vote.voteType;
            const reason = vote.reason;
            const justification = vote.justification;

            // Update vote counts
            const results = session.voteResults.get(entryId);
            if (voteType === 1) {
                results.upvotes++;
                results.netVotes++;
            } else {
                results.downvotes++;
                results.netVotes--;
            }

            // Track justifications
            session.justifications.get(entryId).push(justification);

            // Track reason counts
            const reasonCounts = session.reasonCounts.get(entryId);
            reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        });
    }

    /**
     * Detect sybil behavior using clustering algorithms
     */
    detectSybilBehavior(contestId, voterAddress, revealData) {
        const sybilData = this.sybilDetection.get(contestId);
        
        // Check for similar voting patterns
        const votingPattern = this.extractVotingPattern(revealData);
        const similarVoters = this.findSimilarVoters(contestId, votingPattern);
        
        // Check IP address clustering
        const ipClusters = this.checkIPClustering(contestId, voterAddress);
        
        // Check timing patterns
        const timingPattern = this.checkTimingPattern(contestId, voterAddress);
        
        // Combine signals for sybil detection
        const sybilScore = this.calculateSybilScore({
            similarVoters: similarVoters.length,
            ipClusters,
            timingPattern
        });

        if (sybilScore > 0.7) {
            sybilData.suspiciousVoters.add(voterAddress);
            return true;
        }

        return false;
    }

    /**
     * Extract voting pattern for comparison
     */
    extractVotingPattern(revealData) {
        return {
            entryIds: revealData.votes.map(v => v.entryId).sort(),
            voteTypes: revealData.votes.map(v => v.voteType).sort(),
            reasons: revealData.votes.map(v => v.reason).sort(),
            justificationLength: revealData.votes.map(v => v.justification.length).sort()
        };
    }

    /**
     * Find voters with similar patterns
     */
    findSimilarVoters(contestId, pattern) {
        const reveals = this.voteReveals.get(contestId);
        const similarVoters = [];

        reveals.forEach((revealData, voterAddress) => {
            const otherPattern = this.extractVotingPattern(revealData);
            const similarity = this.calculatePatternSimilarity(pattern, otherPattern);
            
            if (similarity > 0.8) {
                similarVoters.push(voterAddress);
            }
        });

        return similarVoters;
    }

    /**
     * Calculate pattern similarity
     */
    calculatePatternSimilarity(pattern1, pattern2) {
        let matches = 0;
        let total = 0;

        // Compare entry IDs
        const commonEntries = pattern1.entryIds.filter(id => pattern2.entryIds.includes(id));
        matches += commonEntries.length;
        total += Math.max(pattern1.entryIds.length, pattern2.entryIds.length);

        // Compare vote types
        const commonVoteTypes = pattern1.voteTypes.filter(type => pattern2.voteTypes.includes(type));
        matches += commonVoteTypes.length;
        total += Math.max(pattern1.voteTypes.length, pattern2.voteTypes.length);

        // Compare reasons
        const commonReasons = pattern1.reasons.filter(reason => pattern2.reasons.includes(reason));
        matches += commonReasons.length;
        total += Math.max(pattern1.reasons.length, pattern2.reasons.length);

        return total > 0 ? matches / total : 0;
    }

    /**
     * Check IP address clustering
     */
    checkIPClustering(contestId, voterAddress) {
        const commitments = this.voteCommitments.get(contestId);
        const voterCommitment = commitments.get(voterAddress);
        
        if (!voterCommitment) return 0;

        let sameIPCount = 0;
        commitments.forEach((commitment, address) => {
            if (address !== voterAddress && commitment.ipAddress === voterCommitment.ipAddress) {
                sameIPCount++;
            }
        });

        return sameIPCount;
    }

    /**
     * Check timing patterns
     */
    checkTimingPattern(contestId, voterAddress) {
        const commitments = this.voteCommitments.get(contestId);
        const voterCommitment = commitments.get(voterAddress);
        
        if (!voterCommitment) return 0;

        const voterTime = voterCommitment.timestamp.getTime();
        let closeTimeCount = 0;

        commitments.forEach((commitment, address) => {
            if (address !== voterAddress) {
                const timeDiff = Math.abs(commitment.timestamp.getTime() - voterTime);
                if (timeDiff < 60000) { // Within 1 minute
                    closeTimeCount++;
                }
            }
        });

        return closeTimeCount;
    }

    /**
     * Calculate sybil score
     */
    calculateSybilScore(signals) {
        let score = 0;

        // Similar voters penalty
        if (signals.similarVoters > 3) {
            score += 0.4;
        }

        // IP clustering penalty
        if (signals.ipClusters > 2) {
            score += 0.3;
        }

        // Timing pattern penalty
        if (signals.timingPattern > 2) {
            score += 0.3;
        }

        return Math.min(1.0, score);
    }

    /**
     * Track voter for sybil detection
     */
    trackVoterForSybilDetection(contestId, voterAddress, ipAddress) {
        const sybilData = this.sybilDetection.get(contestId);
        
        // Track IP addresses
        if (!sybilData.ipAddresses.has(ipAddress)) {
            sybilData.ipAddresses.set(ipAddress, new Set());
        }
        sybilData.ipAddresses.get(ipAddress).add(voterAddress);
    }

    /**
     * Verify PoI NFT ownership (mock implementation)
     */
    async verifyPoINFT(voterAddress, poiNFTContract) {
        // In production, this would check the blockchain
        // For now, we'll mock it as always true
        return true;
    }

    /**
     * Get voting results for a contest
     */
    getVotingResults(contestId) {
        const session = this.votingSessions.get(contestId);
        if (!session) {
            throw new Error('Voting session not found');
        }

        const results = [];
        session.entryIds.forEach(entryId => {
            const voteData = session.voteResults.get(entryId);
            const justifications = session.justifications.get(entryId);
            const reasonCounts = session.reasonCounts.get(entryId);

            results.push({
                entryId,
                upvotes: voteData.upvotes,
                downvotes: voteData.downvotes,
                netVotes: voteData.netVotes,
                justifications,
                reasonCounts: Object.fromEntries(reasonCounts),
                communityScore: this.calculateCommunityScore(voteData.netVotes, session.totalVoters)
            });
        });

        // Sort by net votes (descending)
        results.sort((a, b) => b.netVotes - a.netVotes);

        return {
            contestId,
            totalVoters: session.totalVoters,
            results,
            suspiciousVoters: Array.from(this.sybilDetection.get(contestId).suspiciousVoters),
            voteReasons: this.voteReasons
        };
    }

    /**
     * Calculate community score (0-100)
     */
    calculateCommunityScore(netVotes, totalVoters) {
        if (totalVoters === 0) return 50; // Neutral score
        
        // Normalize to 0-100 scale
        const maxPossibleVotes = totalVoters * 5; // Assuming max 5 votes per voter
        const normalizedScore = (netVotes + maxPossibleVotes) / (2 * maxPossibleVotes);
        return Math.round(normalizedScore * 100);
    }

    /**
     * Get voting statistics
     */
    getVotingStatistics(contestId) {
        const session = this.votingSessions.get(contestId);
        if (!session) {
            throw new Error('Voting session not found');
        }

        const commitments = this.voteCommitments.get(contestId);
        const reveals = this.voteReveals.get(contestId);
        const sybilData = this.sybilDetection.get(contestId);

        return {
            totalCommitted: commitments.size,
            totalRevealed: reveals.size,
            totalVoters: session.totalVoters,
            suspiciousVoters: sybilData.suspiciousVoters.size,
            ipAddresses: sybilData.ipAddresses.size,
            phase: this.getCurrentPhase(session)
        };
    }

    /**
     * Get current voting phase
     */
    getCurrentPhase(session) {
        const now = new Date();
        
        if (now < session.commitPhaseStart) {
            return 'not_started';
        } else if (now <= session.commitPhaseEnd) {
            return 'commit';
        } else if (now < session.revealPhaseStart) {
            return 'between_phases';
        } else if (now <= session.revealPhaseEnd) {
            return 'reveal';
        } else {
            return 'ended';
        }
    }
}

module.exports = CommitRevealVotingService;
