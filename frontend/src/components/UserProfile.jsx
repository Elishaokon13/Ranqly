import React, { useState, useEffect } from 'react';
import { sampleContests } from '../data/sampleContests';

const UserProfile = ({ userAddress, isOpen, onClose }) => {
  const [userStats, setUserStats] = useState({
    contestsParticipated: 0,
    submissionsMade: 0,
    votesCast: 0,
    rewardsEarned: 0,
    poiNftOwned: false,
    reputation: 0
  });

  const [userActivity, setUserActivity] = useState([]);

  useEffect(() => {
    if (userAddress) {
      // Generate mock user data based on address
      const mockStats = generateUserStats(userAddress);
      setUserStats(mockStats);
      
      // Generate mock activity
      const mockActivity = generateUserActivity(userAddress);
      setUserActivity(mockActivity);
    }
  }, [userAddress]);

  const generateUserStats = (address) => {
    // Use address to generate consistent "random" stats
    const hash = address.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return {
      contestsParticipated: Math.abs(hash) % 15 + 5,
      submissionsMade: Math.abs(hash) % 25 + 10,
      votesCast: Math.abs(hash) % 50 + 20,
      rewardsEarned: Math.abs(hash) % 5000 + 1000,
      poiNftOwned: Math.abs(hash) % 2 === 0,
      reputation: Math.abs(hash) % 100 + 50
    };
  };

  const generateUserActivity = (address) => {
    const activities = [];
    const contestCount = Math.min(5, sampleContests.length);
    
    for (let i = 0; i < contestCount; i++) {
      const contest = sampleContests[i];
      activities.push({
        id: `activity-${i}`,
        type: Math.random() > 0.5 ? 'submission' : 'vote',
        contestTitle: contest.title,
        contestId: contest.id,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        reward: Math.random() > 0.7 ? Math.random() * 1000 : 0
      });
    }
    
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Wallet Address */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {formatAddress(userAddress)}
            </h3>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Connected</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{userStats.contestsParticipated}</div>
              <div className="text-sm text-gray-600">Contests</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.submissionsMade}</div>
              <div className="text-sm text-gray-600">Submissions</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats.votesCast}</div>
              <div className="text-sm text-gray-600">Votes Cast</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{userStats.rewardsEarned.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Rewards (USDC)</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-600">{userStats.reputation}</div>
              <div className="text-sm text-gray-600">Reputation</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {userStats.poiNftOwned ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">PoI NFT</div>
            </div>
          </div>

          {/* PoI NFT Section */}
          {!userStats.poiNftOwned && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🎖️</div>
                <div>
                  <h4 className="font-semibold text-blue-900">Earn Your PoI NFT</h4>
                  <p className="text-sm text-blue-700">
                    Participate in contests and build reputation to mint your Proof of Integrity NFT.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
            <div className="space-y-3">
              {userActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl">
                    {activity.type === 'submission' ? '📝' : '🗳️'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {activity.type === 'submission' ? 'Submitted to' : 'Voted on'} {activity.contestTitle}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                  {activity.reward > 0 && (
                    <div className="text-sm font-medium text-green-600">
                      +{activity.reward.toFixed(2)} USDC
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
              View All Activity
            </button>
            <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;