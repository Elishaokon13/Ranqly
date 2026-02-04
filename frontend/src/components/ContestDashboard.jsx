import React, { useState, useEffect } from 'react';
import ContestCard from './ContestCard';
import ContestCreationModal from './ContestCreationModal';

const ContestDashboard = ({ userAddress }) => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      // Since API Gateway is not working, we'll create mock data for now
      const mockContests = [
        {
          id: '1',
          title: 'Best Web3 DApp Contest',
          description: 'Create the most innovative Web3 decentralized application with focus on user experience and blockchain integration.',
          reward_amount: 2.5,
          organizer_address: '0x742d35Cc6634C0532925a3b8D5a0F6b2e1E8C1e',
          submission_deadline: '2024-12-31T23:59:59Z',
          voting_deadline: '2025-01-07T23:59:59Z',
          status: 'active',
          total_submissions: 12,
          created_at: '2024-10-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'AI-Powered DeFi Innovation',
          description: 'Build innovative DeFi protocols that leverage artificial intelligence for better user experience.',
          reward_amount: 1.8,
          organizer_address: '0x8ba1f109551bD432803012645Hac136c6b8f5c7',
          submission_deadline: '2024-11-30T23:59:59Z',
          voting_deadline: '2024-12-07T23:59:59Z',
          status: 'active',
          total_submissions: 8,
          created_at: '2024-09-15T00:00:00Z'
        },
        {
          id: '3',
          title: 'NFT Marketplace Revolution',
          description: 'Design and build the next generation NFT marketplace with advanced features.',
          reward_amount: 3.2,
          organizer_address: '0x1234567890abcdef1234567890abcdef12345678',
          submission_deadline: '2024-10-15T23:59:59Z',
          voting_deadline: '2024-10-22T23:59:59Z',
          status: 'completed',
          total_submissions: 25,
          created_at: '2024-08-01T00:00:00Z'
        }
      ];
      
      setContests(mockContests);
    } catch (error) {
      console.error('Failed to load contests:', error);
      setError('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  const createContest = async (contestData) => {
    try {
      // In a real app, this would call the API
      console.log('Creating contest:', contestData);
      
      // For demo, add to local state
      const newContest = {
        id: Date.now().toString(),
        ...contestData,
        status: 'active',
        total_submissions: 0,
        created_at: new Date().toISOString()
      };
      
      setContests(prev => [newContest, ...prev]);
      alert('Contest created successfully!');
    } catch (error) {
      console.error('Error creating contest:', error);
      throw error;
    }
  };

  const handleParticipate = (contest) => {
    if (!userAddress) {
      alert('Please connect your wallet first');
      return;
    }
    alert(`Participating in contest: ${contest.title}`);
    // In a real app, this would open a submission modal
  };

  const activeContests = contests.filter(c => c.status === 'active');
  const completedContests = contests.filter(c => c.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contest Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Participate in Web3 contests and showcase your innovation
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!userAddress}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Contest
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{activeContests.length}</div>
          <div className="text-sm text-gray-500">Active Contests</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{completedContests.length}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {contests.reduce((sum, c) => sum + c.total_submissions, 0)}
          </div>
          <div className="text-sm text-gray-500">Total Submissions</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {contests.reduce((sum, c) => sum + c.reward_amount, 0).toFixed(1)} ETH
          </div>
          <div className="text-sm text-gray-500">Total Rewards</div>
        </div>
      </div>

      {/* Active Contests */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Contests</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : activeContests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeContests.map(contest => (
              <ContestCard
                key={contest.id}
                contest={contest}
                onParticipate={handleParticipate}
                userAddress={userAddress}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Contests</h3>
            <p className="text-gray-500">Check back later for new contests!</p>
          </div>
        )}
      </div>

      {/* Completed Contests */}
      {completedContests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Contests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedContests.map(contest => (
              <ContestCard
                key={contest.id}
                contest={contest}
                onParticipate={handleParticipate}
                userAddress={userAddress}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Contest Modal */}
      <ContestCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateContest={createContest}
        userAddress={userAddress}
      />
    </div>
  );
};

export default ContestDashboard;
