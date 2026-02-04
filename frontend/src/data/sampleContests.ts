// Sample contest data for demonstration

export interface Contest {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  reward_token: string;
  submission_deadline: Date;
  voting_deadline: Date;
  rules: string[];
  organizer_address: string;
  status: 'active' | 'voting' | 'completed';
  created_at: Date;
  submissions: any[];
  total_submissions: number;
  total_votes: number;
  category: string;
  difficulty: string;
  tags: string[];
}

export interface ContestStatus {
  status: 'active' | 'voting' | 'completed';
  phase: string;
  color: string;
}

export const sampleContests: Contest[] = [
  {
    id: 'contest-1',
    title: 'Web3 Gaming Innovation Challenge',
    description: 'Create innovative gaming experiences using blockchain technology. Focus on play-to-earn mechanics, NFT integration, and decentralized gaming economies.',
    reward_amount: 50000,
    reward_token: 'USDC',
    submission_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    voting_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    rules: [
      'Must use blockchain technology',
      'Include play-to-earn mechanics',
      'Submit working prototype',
      'Document all smart contracts'
    ],
    organizer_address: '0x1234567890123456789012345678901234567890',
    status: 'active',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    submissions: [],
    total_submissions: 12,
    total_votes: 45,
    category: 'Gaming',
    difficulty: 'Advanced',
    tags: ['gaming', 'web3', 'nft', 'defi']
  },
  {
    id: 'contest-2',
    title: 'DeFi Yield Farming Strategy',
    description: 'Design and implement innovative yield farming strategies that maximize returns while minimizing risk. Focus on sustainable and long-term approaches.',
    reward_amount: 25000,
    reward_token: 'ETH',
    submission_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    voting_deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    rules: [
      'Must include risk analysis',
      'Provide backtesting results',
      'Explain sustainability',
      'Include code implementation'
    ],
    organizer_address: '0x2345678901234567890123456789012345678901',
    status: 'active',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    submissions: [],
    total_submissions: 8,
    total_votes: 32,
    category: 'DeFi',
    difficulty: 'Expert',
    tags: ['defi', 'yield-farming', 'strategy', 'risk-management']
  },
  {
    id: 'contest-3',
    title: 'NFT Art Collection Curation',
    description: 'Curate and create an NFT art collection that showcases unique digital artistry. Focus on originality, artistic merit, and cultural significance.',
    reward_amount: 15000,
    reward_token: 'USDC',
    submission_deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (ended)
    voting_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    rules: [
      'Original artwork only',
      'Minimum 10 pieces',
      'Include artist statement',
      'Metadata must be complete'
    ],
    organizer_address: '0x3456789012345678901234567890123456789012',
    status: 'voting',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    submissions: [],
    total_submissions: 23,
    total_votes: 67,
    category: 'Art',
    difficulty: 'Intermediate',
    tags: ['nft', 'art', 'curation', 'digital-art']
  },
  {
    id: 'contest-4',
    title: 'DAO Governance Tool Development',
    description: 'Build tools that enhance DAO governance processes. Focus on voting mechanisms, proposal systems, and community engagement features.',
    reward_amount: 35000,
    reward_token: 'USDC',
    submission_deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (ended)
    voting_deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (ended)
    rules: [
      'Must be open source',
      'Include security audit',
      'Document all features',
      'Provide demo video'
    ],
    organizer_address: '0x4567890123456789012345678901234567890123',
    status: 'completed',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    submissions: [],
    total_submissions: 15,
    total_votes: 89,
    category: 'Governance',
    difficulty: 'Advanced',
    tags: ['dao', 'governance', 'voting', 'tools']
  },
  {
    id: 'contest-5',
    title: 'Blockchain Education Content',
    description: 'Create educational content about blockchain technology for beginners. Focus on clarity, accuracy, and engaging presentation methods.',
    reward_amount: 10000,
    reward_token: 'USDC',
    submission_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    voting_deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    rules: [
      'Beginner-friendly content',
      'Include interactive elements',
      'Must be accurate',
      'Submit in multiple formats'
    ],
    organizer_address: '0x5678901234567890123456789012345678901234',
    status: 'active',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    submissions: [],
    total_submissions: 6,
    total_votes: 18,
    category: 'Education',
    difficulty: 'Beginner',
    tags: ['education', 'blockchain', 'tutorial', 'content']
  }
];

// Helper functions for contest data
export const getContestStatus = (contest: Contest): ContestStatus => {
  const now = new Date();
  const submissionEnd = new Date(contest.submission_deadline);
  const votingEnd = new Date(contest.voting_deadline);
  
  if (now < submissionEnd) {
    return { status: 'active', phase: 'Submissions Open', color: 'bg-blue-100 text-blue-800' };
  } else if (now < votingEnd) {
    return { status: 'voting', phase: 'Voting Live', color: 'bg-purple-100 text-purple-800' };
  } else {
    return { status: 'completed', phase: 'Completed', color: 'bg-green-100 text-green-800' };
  }
};

export const getTimeLeft = (deadline: Date): string => {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

export const formatReward = (amount: number, token: string): string => {
  return `${amount.toLocaleString()} ${token}`;
};
