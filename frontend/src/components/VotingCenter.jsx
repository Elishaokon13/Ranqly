import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const VotingCenter = ({ contestId, userAddress, isOpen, onClose }) => {
  const [currentPhase, setCurrentPhase] = useState('commit'); // 'commit' or 'reveal'
  const [contest, setContest] = useState(null);
  const [entries, setEntries] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [voteBudget, setVoteBudget] = useState({ upvotes: 0, downvotes: 0, maxUpvotes: 5, maxDownvotes: 2 });
  const [committedHash, setCommittedHash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedVoteType, setSelectedVoteType] = useState('');

  useEffect(() => {
    loadVotingData();
  }, [contestId]);

  const loadVotingData = async () => {
    try {
      setLoading(true);
      
      // Load contest data
      const contestData = await ApiService.getContest(contestId);
      setContest(contestData.contest);
      
      // Load entries for voting
      const entriesData = await ApiService.getContestSubmissions(contestId);
      setEntries(entriesData.submissions || []);
      
      // Determine current phase
      const now = new Date();
      const submissionEnd = new Date(contestData.contest.submission_deadline);
      const votingEnd = new Date(contestData.contest.voting_deadline);
      
      if (now < submissionEnd) {
        setCurrentPhase('submissions');
      } else if (now < votingEnd) {
        // Check if we're in commit or reveal phase
        const commitEnd = new Date(votingEnd.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before end
        setCurrentPhase(now < commitEnd ? 'commit' : 'reveal');
      } else {
        setCurrentPhase('ended');
      }
      
    } catch (error) {
      console.error('Failed to load voting data:', error);
      // Use mock data
      setContest({
        id: contestId,
        title: 'Best Web3 DApp Contest',
        voting_deadline: '2025-01-07T23:59:59Z'
      });
      setEntries([
        {
          id: '1',
          title: 'DeFi Portfolio Manager',
          content: 'A comprehensive DeFi portfolio management tool...',
          submitter_address: '0x1234...5678'
        },
        {
          id: '2', 
          title: 'NFT Marketplace',
          content: 'Next-generation NFT marketplace with advanced features...',
          submitter_address: '0x8765...4321'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteClick = (entry, voteType) => {
    if (!userAddress) {
      alert('Please connect your wallet to vote');
      return;
    }
    
    setSelectedEntry(entry);
    setSelectedVoteType(voteType);
    setShowJustificationModal(true);
  };

  const handleJustificationSubmit = (justification, reasonCode) => {
    const newVote = {
      entryId: selectedEntry.id,
      entryTitle: selectedEntry.title,
      voteType: selectedVoteType,
      justification,
      reasonCode,
      timestamp: new Date().toISOString()
    };
    
    // Check if this replaces an existing vote
    const existingVoteIndex = userVotes.findIndex(vote => vote.entryId === selectedEntry.id);
    
    let updatedVotes;
    if (existingVoteIndex >= 0) {
      updatedVotes = [...userVotes];
      updatedVotes[existingVoteIndex] = newVote;
    } else {
      updatedVotes = [...userVotes, newVote];
    }
    
    setUserVotes(updatedVotes);
    updateVoteBudget(updatedVotes);
    setShowJustificationModal(false);
  };

  const updateVoteBudget = (votes) => {
    const upvotes = votes.filter(v => v.voteType === 'upvote').length;
    const downvotes = votes.filter(v => v.voteType === 'downvote').length;
    
    setVoteBudget({
      upvotes,
      downvotes,
      maxUpvotes: 5,
      maxDownvotes: 2
    });
  };

  const handleCommitVotes = async () => {
    if (!userAddress || userVotes.length === 0) {
      alert('Please cast some votes before committing');
      return;
    }
    
    try {
      // Generate commit hash (simplified)
      const commitData = {
        votes: userVotes,
        timestamp: new Date().toISOString(),
        voterAddress: userAddress
      };
      
      const commitHash = btoa(JSON.stringify(commitData)); // Simplified hash
      
      const commitResult = await ApiService.commitVote({
        contestId,
        voterAddress: userAddress,
        commitHash,
        salt: Math.random().toString(36)
      });
      
      setCommittedHash(commitHash);
      alert('Votes committed successfully! Remember to reveal during the reveal phase.');
      
    } catch (error) {
      console.error('Failed to commit votes:', error);
      alert('Failed to commit votes. Please try again.');
    }
  };

  const handleRevealVotes = async () => {
    if (!committedHash) {
      alert('No committed votes to reveal');
      return;
    }
    
    try {
      const revealResult = await ApiService.revealVote({
        contestId,
        voterAddress: userAddress,
        vote: JSON.stringify(userVotes),
        salt: Math.random().toString(36)
      });
      
      alert('Votes revealed successfully! Thank you for participating.');
      onClose();
      
    } catch (error) {
      console.error('Failed to reveal votes:', error);
      alert('Failed to reveal votes. Please try again.');
    }
  };

  const getPhaseInfo = () => {
    switch (currentPhase) {
      case 'submissions':
        return { 
          title: 'Submissions Still Open', 
          color: 'bg-blue-100 text-blue-800',
          description: 'Voting will begin after the submission deadline.'
        };
      case 'commit':
        return { 
          title: 'Commit Phase', 
          color: 'bg-purple-100 text-purple-800',
          description: 'Cast your votes and commit them. You can update before revealing.'
        };
      case 'reveal':
        return { 
          title: 'Reveal Phase', 
          color: 'bg-green-100 text-green-800',
          description: 'Reveal your committed votes to make them count.'
        };
      case 'ended':
        return { 
          title: 'Voting Ended', 
          color: 'bg-gray-100 text-gray-800',
          description: 'Voting period has concluded.'
        };
      default:
        return { 
          title: 'Voting Not Available', 
          color: 'bg-gray-100 text-gray-800',
          description: 'Voting is not currently available for this contest.'
        };
    }
  };

  const getVoteForEntry = (entryId) => {
    return userVotes.find(vote => vote.entryId === entryId);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const phaseInfo = getPhaseInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Voting Center</h2>
              <p className="text-gray-600">{contest?.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${phaseInfo.color}`}>
                {phaseInfo.title}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Phase Description */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700">{phaseInfo.description}</p>
          </div>

          {/* Vote Budget (Commit Phase) */}
          {currentPhase === 'commit' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-2">Vote Budget</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {voteBudget.upvotes}/{voteBudget.maxUpvotes}
                  </div>
                  <div className="text-sm text-purple-700">Upvotes Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {voteBudget.downvotes}/{voteBudget.maxDownvotes}
                  </div>
                  <div className="text-sm text-purple-700">Downvotes Used</div>
                </div>
              </div>
            </div>
          )}

          {/* Committed Votes Status */}
          {committedHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">Votes Committed</h3>
                  <p className="text-sm text-green-700">
                    Hash: {committedHash.substring(0, 20)}...
                  </p>
                </div>
                {currentPhase === 'reveal' && (
                  <button
                    onClick={handleRevealVotes}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Reveal Votes
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Entries List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contest Entries</h3>
            {entries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entries.map(entry => {
                  const userVote = getVoteForEntry(entry.id);
                  return (
                    <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{entry.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {entry.content?.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            by {entry.submitter_address?.slice(0, 8)}...
                          </p>
                        </div>
                        {userVote && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            userVote.voteType === 'upvote' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {userVote.voteType === 'upvote' ? '👍' : '👎'} Voted
                          </span>
                        )}
                      </div>

                      {/* Voting Actions */}
                      {currentPhase === 'commit' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVoteClick(entry, 'upvote')}
                            disabled={voteBudget.upvotes >= voteBudget.maxUpvotes && !userVote}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                              userVote?.voteType === 'upvote'
                                ? 'bg-green-500 text-white'
                                : voteBudget.upvotes >= voteBudget.maxUpvotes
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            👍 Upvote
                          </button>
                          <button
                            onClick={() => handleVoteClick(entry, 'downvote')}
                            disabled={voteBudget.downvotes >= voteBudget.maxDownvotes && !userVote}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                              userVote?.voteType === 'downvote'
                                ? 'bg-red-500 text-white'
                                : voteBudget.downvotes >= voteBudget.maxDownvotes
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            👎 Downvote
                          </button>
                        </div>
                      )}

                      {/* Vote Justification Display */}
                      {userVote && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium text-gray-700 mb-1">Your Justification:</div>
                          <div className="text-gray-600">{userVote.justification}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-600">No entries available for voting yet.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {currentPhase === 'commit' && (
            <div className="flex justify-between mt-8">
              <div className="text-sm text-gray-500">
                {userVotes.length} vote{userVotes.length !== 1 ? 's' : ''} cast
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleCommitVotes}
                  disabled={userVotes.length === 0}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Commit Votes
                </button>
              </div>
            </div>
          )}

          {currentPhase === 'reveal' && !committedHash && (
            <div className="text-center mt-8">
              <div className="text-gray-400 text-4xl mb-4">⚠️</div>
              <p className="text-gray-600">No committed votes to reveal.</p>
            </div>
          )}
        </div>
      </div>

      {/* Vote Justification Modal */}
      {showJustificationModal && (
        <VoteJustificationModal
          entry={selectedEntry}
          voteType={selectedVoteType}
          onClose={() => setShowJustificationModal(false)}
          onSubmit={handleJustificationSubmit}
        />
      )}
    </div>
  );
};

// Vote Justification Modal Component
const VoteJustificationModal = ({ entry, voteType, onClose, onSubmit }) => {
  const [justification, setJustification] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [errors, setErrors] = useState({});

  const reasonCodes = [
    { value: 'quality', label: 'Content Quality' },
    { value: 'relevance', label: 'Relevance to Contest' },
    { value: 'originality', label: 'Originality' },
    { value: 'technical', label: 'Technical Merit' },
    { value: 'creativity', label: 'Creativity' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!justification.trim() || justification.length < 10) {
      newErrors.justification = 'Justification must be at least 10 characters';
    }
    if (!reasonCode) {
      newErrors.reasonCode = 'Please select a reason code';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(justification, reasonCode);
      setJustification('');
      setReasonCode('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Vote Justification
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-1">Entry:</div>
            <div className="font-medium text-gray-900">{entry?.title}</div>
            <div className={`text-sm font-medium ${
              voteType === 'upvote' ? 'text-green-600' : 'text-red-600'
            }`}>
              {voteType === 'upvote' ? '👍 Upvote' : '👎 Downvote'}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason Code *
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reasonCode ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a reason</option>
                {reasonCodes.map(code => (
                  <option key={code.value} value={code.value}>
                    {code.label}
                  </option>
                ))}
              </select>
              {errors.reasonCode && (
                <p className="text-red-500 text-xs mt-1">{errors.reasonCode}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification *
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows="3"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.justification ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Explain why you're voting this way (minimum 10 characters)..."
                required
              />
              {errors.justification && (
                <p className="text-red-500 text-xs mt-1">{errors.justification}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {justification.length}/10 characters minimum
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
              >
                Save Vote
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VotingCenter;
