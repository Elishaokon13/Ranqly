import { ethers } from 'ethers';
import winston from 'winston';

interface PoINFTInfo {
  balance: number;
  tokenId?: number;
  isRevoked: boolean;
  isValid: boolean;
}

interface OnChainActivity {
  transactions: number;
  contractInteractions: number;
  tokenTransfers: number;
  lastActivity: number;
}

interface ContestInfo {
  contestId: string;
  status: string;
  submissionCount: number;
  votingPhase: string;
  endTime: number;
}

interface VoteTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: number;
  status: 'success' | 'failed';
}

export class BlockchainService {
  private logger: winston.Logger;
  private provider: ethers.Provider;
  private poiNFTContract: ethers.Contract;
  private contestRegistryContract: ethers.Contract;
  private contestVaultContract: ethers.Contract;
  private commitRevealVotingContract: ethers.Contract;
  
  // Contract addresses (would be loaded from environment)
  private readonly POI_NFT_ADDRESS = process.env.POI_NFT_CONTRACT_ADDRESS || '';
  private readonly CONTEST_REGISTRY_ADDRESS = process.env.CONTEST_REGISTRY_CONTRACT_ADDRESS || '';
  private readonly CONTEST_VAULT_ADDRESS = process.env.CONTEST_VAULT_CONTRACT_ADDRESS || '';
  private readonly COMMIT_REVEAL_VOTING_ADDRESS = process.env.COMMIT_REVEAL_VOTING_CONTRACT_ADDRESS || '';
  
  // Contract ABIs (simplified - would be loaded from compiled contracts)
  private readonly POI_NFT_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
    'function isValidHolder(address account) view returns (bool)',
    'function getTokenId(address account) view returns (uint256)',
    'function isRevoked(uint256 tokenId) view returns (bool)'
  ];
  
  private readonly CONTEST_REGISTRY_ABI = [
    'function getContestStatus(bytes32 contestId) view returns (uint8)',
    'function getContestSubmissions(bytes32 contestId) view returns (address[])',
    'function getContestTimeline(bytes32 contestId) view returns (uint256,uint256,uint256,uint256,uint256,uint256)'
  ];
  
  private readonly COMMIT_REVEAL_VOTING_ABI = [
    'function getCurrentPhase() view returns (uint8)',
    'function votes(address, uint256) view returns (bytes32, uint256, uint256, string, bool, bool)',
    'function totalUpvotes(uint256) view returns (uint256)',
    'function totalDownvotes(uint256) view returns (uint256)'
  ];

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/blockchain-service.log' })
      ]
    });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize provider
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize contracts
      this.poiNFTContract = new ethers.Contract(
        this.POI_NFT_ADDRESS,
        this.POI_NFT_ABI,
        this.provider
      );

      this.contestRegistryContract = new ethers.Contract(
        this.CONTEST_REGISTRY_ADDRESS,
        this.CONTEST_REGISTRY_ABI,
        this.provider
      );

      this.commitRevealVotingContract = new ethers.Contract(
        this.COMMIT_REVEAL_VOTING_ADDRESS,
        this.COMMIT_REVEAL_VOTING_ABI,
        this.provider
      );

      this.contestVaultContract = new ethers.Contract(
        this.CONTEST_VAULT_ADDRESS,
        [], // Simplified ABI
        this.provider
      );

      // Test connection
      const network = await this.provider.getNetwork();
      this.logger.info(`Connected to blockchain network: ${network.name} (${network.chainId})`);

      // Verify contract addresses
      await this.verifyContracts();

      this.logger.info('Blockchain Service initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize Blockchain Service: ${error}`);
      throw error;
    }
  }

  private async verifyContracts(): Promise<void> {
    try {
      // Verify PoI NFT contract
      if (this.POI_NFT_ADDRESS) {
        const code = await this.provider.getCode(this.POI_NFT_ADDRESS);
        if (code === '0x') {
          this.logger.warn('PoI NFT contract not found at specified address');
        } else {
          this.logger.info('PoI NFT contract verified');
        }
      }

      // Verify Contest Registry contract
      if (this.CONTEST_REGISTRY_ADDRESS) {
        const code = await this.provider.getCode(this.CONTEST_REGISTRY_ADDRESS);
        if (code === '0x') {
          this.logger.warn('Contest Registry contract not found at specified address');
        } else {
          this.logger.info('Contest Registry contract verified');
        }
      }

    } catch (error) {
      this.logger.error(`Error verifying contracts: ${error}`);
    }
  }

  async getPoINFTBalance(address: string): Promise<number> {
    try {
      if (!this.poiNFTContract) {
        this.logger.warn('PoI NFT contract not initialized');
        return 0;
      }

      const balance = await this.poiNFTContract.balanceOf(address);
      return parseInt(balance.toString());

    } catch (error) {
      this.logger.error(`Error getting PoI NFT balance for ${address}: ${error}`);
      return 0;
    }
  }

  async getPoINFTInfo(address: string): Promise<PoINFTInfo> {
    try {
      if (!this.poiNFTContract) {
        return {
          balance: 0,
          isRevoked: false,
          isValid: false
        };
      }

      const balance = await this.getPoINFTBalance(address);
      const isValid = await this.poiNFTContract.isValidHolder(address);
      
      let tokenId: number | undefined;
      let isRevoked = false;

      if (balance > 0) {
        tokenId = parseInt((await this.poiNFTContract.getTokenId(address)).toString());
        isRevoked = await this.poiNFTContract.isRevoked(tokenId);
      }

      return {
        balance,
        tokenId,
        isRevoked,
        isValid
      };

    } catch (error) {
      this.logger.error(`Error getting PoI NFT info for ${address}: ${error}`);
      return {
        balance: 0,
        isRevoked: false,
        isValid: false
      };
    }
  }

  async getOnChainActivity(address: string, days: number = 30): Promise<number> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const blockRange = Math.floor(days * 24 * 60 * 60 / 12); // Assuming 12-second block time
      const fromBlock = Math.max(0, currentBlock - blockRange);

      // Get transaction history
      const filter = {
        fromBlock,
        toBlock: 'latest',
        address
      };

      const logs = await this.provider.getLogs(filter);
      return logs.length;

    } catch (error) {
      this.logger.error(`Error getting on-chain activity for ${address}: ${error}`);
      return 0;
    }
  }

  async getDetailedOnChainActivity(address: string, days: number = 30): Promise<OnChainActivity> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const blockRange = Math.floor(days * 24 * 60 * 60 / 12);
      const fromBlock = Math.max(0, currentBlock - blockRange);

      let transactions = 0;
      let contractInteractions = 0;
      let tokenTransfers = 0;
      let lastActivity = 0;

      // Get all transactions for the address
      const filter = {
        fromBlock,
        toBlock: 'latest',
        address
      };

      const logs = await this.provider.getLogs(filter);
      
      for (const log of logs) {
        transactions++;
        
        // Check if it's a contract interaction
        const code = await this.provider.getCode(log.address);
        if (code !== '0x') {
          contractInteractions++;
        }

        // Check if it's a token transfer (simplified)
        if (log.topics.length >= 3) {
          tokenTransfers++;
        }

        lastActivity = Math.max(lastActivity, log.blockNumber);
      }

      return {
        transactions,
        contractInteractions,
        tokenTransfers,
        lastActivity
      };

    } catch (error) {
      this.logger.error(`Error getting detailed on-chain activity for ${address}: ${error}`);
      return {
        transactions: 0,
        contractInteractions: 0,
        tokenTransfers: 0,
        lastActivity: 0
      };
    }
  }

  async getContestInfo(contestId: string): Promise<ContestInfo | null> {
    try {
      if (!this.contestRegistryContract) {
        this.logger.warn('Contest Registry contract not initialized');
        return null;
      }

      const contestIdBytes = ethers.id(contestId);
      
      const status = await this.contestRegistryContract.getContestStatus(contestIdBytes);
      const submissions = await this.contestRegistryContract.getContestSubmissions(contestIdBytes);
      const timeline = await this.contestRegistryContract.getContestTimeline(contestIdBytes);

      return {
        contestId,
        status: this.parseContestStatus(status),
        submissionCount: submissions.length,
        votingPhase: this.parseVotingPhase(timeline),
        endTime: parseInt(timeline[5].toString()) // finalizationTime
      };

    } catch (error) {
      this.logger.error(`Error getting contest info for ${contestId}: ${error}`);
      return null;
    }
  }

  async getVotingPhase(contestId: string): Promise<string> {
    try {
      if (!this.commitRevealVotingContract) {
        return 'unknown';
      }

      const phase = await this.commitRevealVotingContract.getCurrentPhase();
      return this.parseVotingPhaseValue(phase);

    } catch (error) {
      this.logger.error(`Error getting voting phase for ${contestId}: ${error}`);
      return 'unknown';
    }
  }

  async getVoteCounts(submissionId: string): Promise<{ upvotes: number; downvotes: number }> {
    try {
      if (!this.commitRevealVotingContract) {
        return { upvotes: 0, downvotes: 0 };
      }

      const upvotes = await this.commitRevealVotingContract.totalUpvotes(submissionId);
      const downvotes = await this.commitRevealVotingContract.totalDownvotes(submissionId);

      return {
        upvotes: parseInt(upvotes.toString()),
        downvotes: parseInt(downvotes.toString())
      };

    } catch (error) {
      this.logger.error(`Error getting vote counts for submission ${submissionId}: ${error}`);
      return { upvotes: 0, downvotes: 0 };
    }
  }

  async getVoteInfo(voterAddress: string, submissionId: string): Promise<any> {
    try {
      if (!this.commitRevealVotingContract) {
        return null;
      }

      const voteInfo = await this.commitRevealVotingContract.votes(voterAddress, submissionId);
      
      return {
        commitHash: voteInfo[0],
        voteValue: parseInt(voteInfo[1].toString()),
        submissionId: parseInt(voteInfo[2].toString()),
        justificationHash: voteInfo[3],
        revealed: voteInfo[4],
        isValid: voteInfo[5]
      };

    } catch (error) {
      this.logger.error(`Error getting vote info for ${voterAddress}, ${submissionId}: ${error}`);
      return null;
    }
  }

  async validateWalletSignature(message: string, signature: string, expectedAddress: string): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    } catch (error) {
      this.logger.error(`Error validating wallet signature: ${error}`);
      return false;
    }
  }

  async getTransactionStatus(txHash: string): Promise<VoteTransaction | null> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return null;
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      const block = await this.provider.getBlock(tx.blockNumber!);

      return {
        hash: txHash,
        blockNumber: tx.blockNumber!,
        timestamp: block!.timestamp,
        gasUsed: receipt!.gasUsed,
        status: receipt!.status === 1 ? 'success' : 'failed'
      };

    } catch (error) {
      this.logger.error(`Error getting transaction status for ${txHash}: ${error}`);
      return null;
    }
  }

  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getFeeData();
      return ethers.formatUnits(gasPrice.gasPrice!, 'gwei');

    } catch (error) {
      this.logger.error(`Error getting gas price: ${error}`);
      return '0';
    }
  }

  async getNetworkInfo(): Promise<{ name: string; chainId: number; blockNumber: number }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber
      };

    } catch (error) {
      this.logger.error(`Error getting network info: ${error}`);
      return {
        name: 'unknown',
        chainId: 0,
        blockNumber: 0
      };
    }
  }

  async isAddressValid(address: string): Promise<boolean> {
    try {
      return ethers.isAddress(address);

    } catch (error) {
      this.logger.error(`Error validating address ${address}: ${error}`);
      return false;
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);

    } catch (error) {
      this.logger.error(`Error getting balance for ${address}: ${error}`);
      return '0';
    }
  }

  private parseContestStatus(status: number): string {
    const statuses = [
      'Announced',
      'SubmissionsOpen',
      'AlgorithmicPreRanking',
      'DisputesAndNominations',
      'CommunityVoting',
      'AnonymousJudging',
      'Finalizing',
      'Completed',
      'Cancelled'
    ];
    
    return statuses[status] || 'Unknown';
  }

  private parseVotingPhase(timeline: any[]): string {
    const now = Math.floor(Date.now() / 1000);
    const [announcementTime, submissionEndTime, disputeEndTime, communityVotingEndTime, judgingEndTime, finalizationTime] = timeline;

    if (now < parseInt(submissionEndTime.toString())) {
      return 'submissions';
    } else if (now < parseInt(disputeEndTime.toString())) {
      return 'disputes';
    } else if (now < parseInt(communityVotingEndTime.toString())) {
      return 'community_voting';
    } else if (now < parseInt(judgingEndTime.toString())) {
      return 'anonymous_judging';
    } else if (now < parseInt(finalizationTime.toString())) {
      return 'finalizing';
    } else {
      return 'completed';
    }
  }

  private parseVotingPhaseValue(phase: number): string {
    const phases = ['Commit', 'Reveal', 'Closed'];
    return phases[phase] || 'Unknown';
  }

  async close(): Promise<void> {
    this.logger.info('Blockchain Service closed');
  }
}
