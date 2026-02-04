import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const Leaderboard = ({ contestId, onVote, onNominate, onDispute, userAddress }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('finalScore');
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [contest, setContest] = useState(null);

  useEffect(() => {
    loadLeaderboardData();
  }, [contestId]);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading leaderboard data for contest:', contestId);
      
      // Try to load contest data
      try {
        const contestData = await ApiService.getContestById(contestId);
        setContest(contestData.contest);
        console.log('Loaded contest data:', contestData.contest);
      } catch (error) {
        console.warn('Failed to load contest data, using mock:', error);
        // Use mock contest data
        const mockContest = {
          id: contestId,
          title: 'Best Web3 DApp Contest',
          description: 'Create the most innovative Web3 decentralized application',
          reward_amount: 2.5,
          status: 'active'
        };
        setContest(mockContest);
        console.log('Using mock contest data:', mockContest);
      }
      
      // Try to load results/leaderboard
      try {
        const resultsData = await ApiService.getContestResults(contestId);
        console.log('Loaded results data:', resultsData);
        
        // Transform data for leaderboard display
        const leaderboardData = (resultsData.submissions || []).map((submission, index) => ({
          rank: index + 1,
          id: submission.id,
          title: submission.title || `Entry #${index + 1}`,
          creator: submission.submitter_address?.slice(0, 8) + '...',
          finalScore: submission.final_score || 0,
          algoScore: submission.analysis_result?.overall_score || 0,
          communityScore: submission.community_score || 0,
          judgeScore: submission.judge_score || 0,
          nominations: submission.nominations || 0,
          disputes: submission.disputes || 0,
          voteExclusions: submission.vote_exclusions || 0,
          analysisDetails: submission.analysis_result?.analysis_details || {},
          status: submission.status || 'active'
        }));
        
        console.log('Transformed leaderboard data:', leaderboardData);
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.warn('Failed to load results data, using mock:', error);
        // Use mock leaderboard data
        const mockLeaderboard = [
          {
            rank: 1,
            id: '1',
            title: 'DeFi Portfolio Manager',
            creator: '0x1234...5678',
            finalScore: 87.5,
            algoScore: 82.0,
            communityScore: 91.2,
            judgeScore: 89.3,
            nominations: 15,
            disputes: 0,
            voteExclusions: 2,
            status: 'winner'
          },
          {
            rank: 2,
            id: '2',
            title: 'NFT Marketplace Revolution',
            creator: '0x8765...4321',
            finalScore: 84.2,
            algoScore: 78.5,
            communityScore: 88.7,
            judgeScore: 85.6,
            nominations: 12,
            disputes: 1,
            voteExclusions: 1,
            status: 'active'
          },
          {
            rank: 3,
            id: '3',
            title: 'Cross-Chain Bridge Protocol',
            creator: '0xabcd...efgh',
            finalScore: 79.8,
            algoScore: 75.2,
            communityScore: 82.1,
            judgeScore: 82.0,
            nominations: 8,
            disputes: 0,
            voteExclusions: 0,
            status: 'active'
          }
        ];
        console.log('Using mock leaderboard data:', mockLeaderboard);
        setLeaderboard(mockLeaderboard);
      }
      
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // Fallback to basic mock data
      const fallbackContest = {
        id: contestId,
        title: 'Best Web3 DApp Contest',
        description: 'Create the most innovative Web3 decentralized application',
        reward_amount: 2.5,
        status: 'active'
      };
      setContest(fallbackContest);
      setLeaderboard([]);
      console.log('Using fallback contest data:', fallbackContest);
    } finally {
      setLoading(false);
      console.log('Finished loading leaderboard data. Loading:', false);
    }
  };

  const handleSort = (sortField) => {
    setSortBy(sortField);
    
    const sorted = [...leaderboard].sort((a, b) => {
      switch (sortField) {
        case 'finalScore':
          return b.finalScore - a.finalScore;
        case 'algoScore':
          return b.algoScore - a.algoScore;
        case 'communityScore':
          return b.communityScore - a.communityScore;
        case 'judgeScore':
          return b.judgeScore - a.judgeScore;
        case 'nominations':
          return b.nominations - a.nominations;
        default:
          return a.rank - b.rank;
      }
    });
    
    // Update ranks
    const updatedRanks = sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    setLeaderboard(updatedRanks);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return { icon: '🥇', color: 'bg-yellow-100 text-yellow-800' };
      case 2:
        return { icon: '🥈', color: 'bg-gray-100 text-gray-800' };
      case 3:
        return { icon: '🥉', color: 'bg-orange-100 text-orange-800' };
      default:
        return { icon: rank, color: 'bg-blue-100 text-blue-800' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'winner':
        return { text: 'Winner', color: 'bg-green-100 text-green-800' };
      case 'disputed':
        return { text: 'Disputed', color: 'bg-red-100 text-red-800' };
      default:
        return { text: 'Active', color: 'bg-blue-100 text-blue-800' };
    }
  };

  if (loading) {
    console.log('Leaderboard is loading...');
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  console.log('Leaderboard render - loading:', loading, 'leaderboard:', leaderboard, 'contest:', contest);

  // Force show mock data for debugging
  const debugLeaderboard = [
    {
      rank: 1,
      id: 'debug1',
      title: 'Debug Entry 1',
      creator: '0x1234...5678',
      finalScore: 87.5,
      algoScore: 82.0,
      communityScore: 91.2,
      judgeScore: 89.3,
      nominations: 15,
      disputes: 0,
      voteExclusions: 2,
      status: 'winner'
    }
  ];

  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : debugLeaderboard;
  console.log('Display leaderboard:', displayLeaderboard);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          <p className="text-gray-600">Current rankings and scores</p>
        </div>
        
        {/* Sort Controls */}
        <div className="mt-4 sm:mt-0">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSort('finalScore')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'finalScore' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Final Score
            </button>
            <button
              onClick={() => handleSort('algoScore')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'algoScore' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              AI Score
            </button>
            <button
              onClick={() => handleSort('communityScore')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'communityScore' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Community
            </button>
            <button
              onClick={() => handleSort('judgeScore')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'judgeScore' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Judges
            </button>
          </div>
        </div>
      </div>

      {/* Prize Distribution Visualization */}
      {displayLeaderboard.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prize Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(rank => {
              const entry = displayLeaderboard.find(e => e.rank === rank);
              const percentages = [50, 30, 20];
              const prize = contest?.reward_amount ? (contest.reward_amount * percentages[rank - 1] / 100) : 0;
              
              return (
                <div key={rank} className="text-center">
                  <div className="text-2xl mb-2">
                    {rank === 1 && '🥇'}
                    {rank === 2 && '🥈'}
                    {rank === 3 && '🥉'}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {entry?.title || `Rank ${rank}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {percentages[rank - 1]}% • {prize.toFixed(2)} ETH
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {displayLeaderboard.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {displayLeaderboard.map((entry) => {
              const rankBadge = getRankBadge(entry.rank);
              const statusBadge = getStatusBadge(entry.status);
              const isExpanded = expandedEntry === entry.id;
              
              return (
                <div key={entry.id} className="p-6">
                  {/* Main Entry Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${rankBadge.color}`}>
                        {rankBadge.icon}
                      </div>
                      
                      {/* Entry Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">by {entry.creator}</p>
                      </div>
                    </div>
                    
                    {/* Scores */}
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(entry.finalScore)}`}>
                          {entry.finalScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Final</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${getScoreColor(entry.algoScore)}`}>
                          {entry.algoScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">AI</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${getScoreColor(entry.communityScore)}`}>
                          {entry.communityScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Community</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${getScoreColor(entry.judgeScore)}`}>
                          {entry.judgeScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Judges</div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {isExpanded ? 'Hide' : 'View'} Details
                      </button>
                      
                      {userAddress && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onVote && onVote(entry.id)}
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            Vote
                          </button>
                          <button
                            onClick={() => onNominate && onNominate(entry.id)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            Nominate
                          </button>
                          <button
                            onClick={() => onDispute && onDispute(entry.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Score Breakdown */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Score Breakdown</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Algorithm Score</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${entry.algoScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{entry.algoScore.toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Community Score</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${entry.communityScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{entry.communityScore.toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Judge Score</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-500 h-2 rounded-full" 
                                    style={{ width: `${entry.judgeScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{entry.judgeScore.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Statistics */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Nominations</span>
                              <span className="text-sm font-medium">{entry.nominations}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Disputes</span>
                              <span className="text-sm font-medium">{entry.disputes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Vote Exclusions</span>
                              <span className="text-sm font-medium">{entry.voteExclusions}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Analysis Details */}
                      {entry.analysisDetails && Object.keys(entry.analysisDetails).length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">AI Analysis Details</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(entry.analysisDetails).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <div className="text-lg font-semibold text-gray-900">
                                  {typeof value === 'number' ? value.toFixed(1) : value}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
            <p className="text-gray-600">Leaderboard will be available after voting ends.</p>
          </div>
        )}
      </div>
      
      {/* Download Audit Pack */}
      <div className="text-center">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Download Audit Pack
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
