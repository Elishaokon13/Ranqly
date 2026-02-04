/**
 * Ranqly JavaScript SDK
 * Provides easy integration with the Ranqly platform
 */

import axios from 'axios';
import { ethers } from 'ethers';

class RanqlyClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL || 'http://localhost:8000';
        this.network = config.network || 'hardhat';
        this.provider = config.provider;
        this.signer = config.signer;
        
        // Initialize HTTP client
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined
            }
        });
        
        // Contract addresses
        this.contracts = {
            poiNFT: config.contracts?.poiNFT,
            contestVault: config.contracts?.contestVault,
            voting: config.contracts?.voting
        };
    }

    /**
     * Contest Management
     */
    async createContest(contestData) {
        try {
            const response = await this.client.post('/api/v1/contests', contestData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getContest(contestId) {
        try {
            const response = await this.client.get(`/api/v1/contests/${contestId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async listContests(params = {}) {
        try {
            const response = await this.client.get('/api/v1/contests', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Content Submission
     */
    async submitContent(contestId, submissionData) {
        try {
            const response = await this.client.post(`/api/v1/contests/${contestId}/submissions`, submissionData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getSubmission(submissionId) {
        try {
            const response = await this.client.get(`/api/v1/submissions/${submissionId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Content Analysis
     */
    async analyzeContent(analysisData) {
        try {
            const response = await this.client.post('/api/v1/analyze', analysisData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getFourAxisScore(contentData) {
        try {
            const response = await this.client.post('/api/v1/four-axis-score', contentData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * PoI NFT Management
     */
    async checkPoIStatus(address) {
        try {
            const response = await this.client.get(`/api/v1/poi/status/${address}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async mintPoI(mintData) {
        try {
            const response = await this.client.post('/api/v1/poi/mint', mintData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Voting System
     */
    async createVotingSession(sessionData) {
        try {
            const response = await this.client.post('/api/v1/voting/session/create', sessionData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async commitVote(commitData) {
        try {
            const response = await this.client.post('/api/v1/voting/commit-enhanced', commitData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async revealVote(revealData) {
        try {
            const response = await this.client.post('/api/v1/voting/reveal-enhanced', revealData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getVotingResults(contestId) {
        try {
            const response = await this.client.get(`/api/v1/voting/${contestId}/results-enhanced`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Anonymous Judging
     */
    async createJudgingSession(sessionData) {
        try {
            const response = await this.client.post('/api/v1/judge/session/create', sessionData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async submitJudgeBallot(ballotData) {
        try {
            const response = await this.client.post('/api/v1/judge/ballot/submit', ballotData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getJudgingResults(sessionId) {
        try {
            const response = await this.client.get(`/api/v1/judge/session/${sessionId}/results`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Dispute System
     */
    async fileDispute(disputeData) {
        try {
            const response = await this.client.post('/api/v1/dispute/file', disputeData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async submitNomination(nominationData) {
        try {
            const response = await this.client.post('/api/v1/nomination/submit', nominationData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getContestDisputes(contestId) {
        try {
            const response = await this.client.get(`/api/v1/dispute/contest/${contestId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Content Caching
     */
    async submitContentForCaching(cacheData) {
        try {
            const response = await this.client.post('/api/v1/content/submit', cacheData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getCachedContent(contentHash) {
        try {
            const response = await this.client.get(`/api/v1/content/${contentHash}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Smart Contract Interactions
     */
    async mintPoINFT(userAddress, signature, nonce) {
        if (!this.signer || !this.contracts.poiNFT) {
            throw new Error('Signer and PoI NFT contract address required for blockchain interactions');
        }

        try {
            const poiNFT = new ethers.Contract(
                this.contracts.poiNFT,
                poiNFTABI,
                this.signer
            );

            const mintFee = await poiNFT.mintFee();
            const tx = await poiNFT.mintPoI(signature, nonce, { value: mintFee });
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.transactionHash,
                tokenId: receipt.events.find(e => e.event === 'PoIMinted').args.tokenId
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async checkPoINFTBalance(address) {
        if (!this.provider || !this.contracts.poiNFT) {
            throw new Error('Provider and PoI NFT contract address required');
        }

        try {
            const poiNFT = new ethers.Contract(
                this.contracts.poiNFT,
                poiNFTABI,
                this.provider
            );

            const balance = await poiNFT.balanceOf(address);
            const hasVotingRights = await poiNFT.hasVotingRights(address);

            return {
                balance: balance.toString(),
                hasVotingRights,
                address
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Utility Functions
     */
    generateVoteCommitment(voteData) {
        const dataToHash = JSON.stringify({
            votes: voteData.votes,
            nonce: voteData.nonce,
            timestamp: voteData.timestamp
        });
        
        return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataToHash));
    }

    generateSignature(message, privateKey) {
        const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));
        const wallet = new ethers.Wallet(privateKey);
        return wallet.signMessage(ethers.utils.arrayify(messageHash));
    }

    /**
     * Event Listeners
     */
    on(event, callback) {
        // WebSocket or polling-based event listening
        // Implementation depends on backend event system
        console.warn('Event listening not implemented yet');
    }

    /**
     * Error Handling
     */
    handleError(error) {
        if (error.response) {
            // API error
            return new RanqlyError(
                error.response.data.error?.message || 'API Error',
                error.response.status,
                error.response.data
            );
        } else if (error.request) {
            // Network error
            return new RanqlyError('Network Error', 0, null);
        } else {
            // Other error
            return new RanqlyError(error.message, 0, null);
        }
    }
}

/**
 * Custom Error Class
 */
class RanqlyError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'RanqlyError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Contract ABIs (Simplified)
 */
const poiNFTABI = [
    "function mintPoI(bytes memory signature, uint256 nonce) external payable",
    "function balanceOf(address owner) view returns (uint256)",
    "function hasVotingRights(address voter) view returns (bool)",
    "function mintFee() view returns (uint256)",
    "event PoIMinted(address indexed to, uint256 indexed tokenId, uint256 mintFee)"
];

/**
 * Factory Function
 */
export function createRanqlyClient(config) {
    return new RanqlyClient(config);
}

export { RanqlyClient, RanqlyError };
export default RanqlyClient;
