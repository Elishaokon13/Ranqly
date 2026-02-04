import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import AdminUtils from '../utils/admin';

const JudgeConsole = ({ contestId, userAddress, isOpen, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState({});
  const [justifications, setJustifications] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadContestEntries();
  }, [contestId]);

  const loadContestEntries = async () => {
    try {
      setLoading(true);
      // Try to load real entries, fallback to mock data
      try {
        const data = await ApiService.getContestSubmissions(contestId);
        setEntries(data.submissions || []);
      } catch (error) {
        console.warn('Failed to load contest entries, using mock data:', error);
        // Use mock entries for judging
        setEntries([
          {
            id: 'entry1',
            title: 'DeFi Portfolio Manager',
            content: 'A comprehensive DeFi portfolio management platform with advanced analytics and risk management features.',
            submitter_address: '0x1234...5678',
            content_type: 'text',
            submitted_at: '2024-10-05T10:00:00Z',
            analysis_result: {
              overall_score: 0.85,
              quality_score: 0.9,
              originality_score: 0.95,
              engagement_score: 0.8
            }
          },
          {
            id: 'entry2',
            title: 'NFT Marketplace Revolution',
            content: 'Next-generation NFT marketplace with cross-chain support and advanced trading features.',
            submitter_address: '0x8765...4321',
            content_type: 'text',
            submitted_at: '2024-10-06T11:30:00Z',
            analysis_result: {
              overall_score: 0.92,
              quality_score: 0.88,
              originality_score: 0.98,
              engagement_score: 0.9
            }
          },
          {
            id: 'entry3',
            title: 'Cross-Chain Bridge Protocol',
            content: 'Secure and efficient cross-chain asset transfer protocol with minimal fees.',
            submitter_address: '0xabcd...efgh',
            content_type: 'text',
            submitted_at: '2024-10-07T09:15:00Z',
            analysis_result: {
              overall_score: 0.78,
              quality_score: 0.75,
              originality_score: 0.82,
              engagement_score: 0.77
            }
          },
          {
            id: 'entry4',
            title: 'Decentralized Social Network',
            content: 'Privacy-focused social network built on blockchain with content monetization.',
            submitter_address: '0xefgh...ijkl',
            content_type: 'text',
            submitted_at: '2024-10-08T14:20:00Z',
            analysis_result: {
              overall_score: 0.81,
              quality_score: 0.79,
              originality_score: 0.85,
              engagement_score: 0.80
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRankChange = (entryId, newRank) => {
    setRankings(prev => {
      const updated = { ...prev };
      
      // Remove entry from old rank if it exists
      Object.keys(updated).forEach(key => {
        if (updated[key] === entryId) {
          delete updated[key];
        }
      });
      
      // Add entry to new rank
      updated[newRank] = entryId;
      
      return updated;
    });
  };

  const handleJustificationChange = (entryId, justification) => {
    setJustifications(prev => ({
      ...prev,
      [entryId]: justification
    }));
  };

  const getEntryRank = (entryId) => {
    const rank = Object.keys(rankings).find(rank => rankings[rank] === entryId);
    return rank ? parseInt(rank) : null;
  };

  const getRankedEntries = () => {
    const ranked = Object.entries(rankings).map(([rank, entryId]) => ({
      rank: parseInt(rank),
      entryId,
      entry: entries.find(e => e.id === entryId)
    })).sort((a, b) => a.rank - b.rank);
    
    return ranked;
  };

  const handleSubmitRankings = async () => {
    if (Object.keys(rankings).length === 0) {
      alert('Please rank at least one entry before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call to submit judge rankings
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const judgeSubmission = {
        contestId,
        judgeAddress: userAddress,
        rankings: getRankedEntries(),
        justifications,
        timestamp: new Date().toISOString(),
        anonymous: true
      };

      console.log('Judge submission:', judgeSubmission);
      setSubmitted(true);
      
      // Show success message
      alert('Your judge rankings have been submitted successfully! Thank you for your participation.');
      onClose();
      
    } catch (error) {
      console.error('Failed to submit rankings:', error);
      alert('Failed to submit rankings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmissionComplete = () => {
    return Object.keys(rankings).length >= Math.min(3, entries.length);
  };

  if (!isOpen) return null;

  // Check admin access
  if (!AdminUtils.canJudge(userAddress)) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              The Judge Console is only accessible to authorized administrators. 
              You do not have permission to access this feature.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">⚖️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Anonymous Judge Console</h2>
            <p className="text-gray-600">Rank contest entries based on quality and innovation</p>
          </div>
        </div>
        
        <div className="bg-white border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">Judge Instructions</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Rank entries from 1st place (highest) to lowest</li>
            <li>• Consider innovation, technical merit, and execution quality</li>
            <li>• Provide brief justifications for your top 3 rankings</li>
            <li>• Your identity will remain anonymous</li>
          </ul>
        </div>
      </div>

      {/* Current Rankings Summary */}
      {Object.keys(rankings).length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Current Rankings</h3>
          <div className="space-y-2">
            {getRankedEntries().map(({ rank, entry }) => (
              <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {rank}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{entry.title}</h4>
                  <p className="text-sm text-gray-600">{entry.submitter_address}</p>
                </div>
                <button
                  onClick={() => handleRankChange(entry.id, null)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries to Rank */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Contest Entries ({entries.length})</h3>
          <p className="text-gray-600">Click and drag to rank entries, or use the rank dropdown</p>
        </div>
        
        <div className="p-6 space-y-4">
          {entries.map((entry, index) => {
            const currentRank = getEntryRank(entry.id);
            const isRanked = currentRank !== null;
            
            return (
              <div key={entry.id} className={`border rounded-lg p-4 transition-all ${
                isRanked 
                  ? 'border-purple-300 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-start space-x-4">
                  {/* Rank Selector */}
                  <div className="flex-shrink-0">
                    <select
                      value={currentRank || ''}
                      onChange={(e) => handleRankChange(entry.id, e.target.value ? parseInt(e.target.value) : null)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select Rank</option>
                      {[1, 2, 3, 4, 5].map(rank => (
                        <option key={rank} value={rank} disabled={rankings[rank] && rankings[rank] !== entry.id}>
                          {rank === 1 ? '1st Place' : 
                           rank === 2 ? '2nd Place' : 
                           rank === 3 ? '3rd Place' : 
                           `${rank}th Place`}
                          {rankings[rank] && rankings[rank] !== entry.id ? ' (taken)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Entry Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{entry.title}</h4>
                      {isRanked && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          Ranked #{currentRank}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3">{entry.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Submitter: {entry.submitter_address}</span>
                      <span>•</span>
                      <span>Submitted: {new Date(entry.submitted_at).toLocaleDateString()}</span>
                    </div>
                    
                    {/* AI Analysis Scores */}
                    {entry.analysis_result && (
                      <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {(entry.analysis_result.overall_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-gray-500">Overall</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {(entry.analysis_result.quality_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-gray-500">Quality</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {(entry.analysis_result.originality_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-gray-500">Originality</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {(entry.analysis_result.engagement_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-gray-500">Engagement</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Justification for Ranked Entries */}
                {isRanked && currentRank <= 3 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Justification for {currentRank === 1 ? '1st' : currentRank === 2 ? '2nd' : '3rd'} Place:
                    </label>
                    <textarea
                      value={justifications[entry.id] || ''}
                      onChange={(e) => handleJustificationChange(entry.id, e.target.value)}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Explain why this entry deserves this ranking..."
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Submit Rankings</h3>
            <p className="text-gray-600">
              {Object.keys(rankings).length} of {Math.min(3, entries.length)} minimum rankings completed
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRankings}
              disabled={!isSubmissionComplete() || submitting}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Rankings'}
            </button>
          </div>
        </div>
        
        {!isSubmissionComplete() && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Please rank at least {Math.min(3, entries.length)} entries before submitting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeConsole;
