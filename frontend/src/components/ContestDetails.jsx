import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sampleContests, getContestStatus, getTimeLeft, formatReward } from '../data/sampleContests';

const ContestDetails = ({ userAddress, onSubmit }) => {
  const { contestId } = useParams();
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [submissionData, setSubmissionData] = useState({
    title: '',
    description: '',
    content: '',
    content_type: 'text',
    tags: [''],
    social_links: {
      twitter: '',
      github: '',
      website: ''
    },
    word_count: 0,
    originality_statement: false,
    terms_accepted: false
  });

  const [votingData, setVotingData] = useState({
    selectedEntry: '',
    voteType: 'upvote',
    justification: ''
  });

  const [nftData, setNftData] = useState({
    message: '',
    signature: ''
  });

  const [disputeData, setDisputeData] = useState({
    entryId: '',
    reasonCode: 'A8',
    explanation: '',
    evidence: ''
  });

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/contests/${contestId}`);
        const data = await response.json();
        if (data.success) {
          setContest(data.contest);
        } else {
          // Fallback to sample contests if API fails
          const sampleContest = sampleContests.find(c => c.id === contestId);
          setContest(sampleContest);
        }
      } catch (error) {
        console.error('Error fetching contest:', error);
        // Fallback to sample contests if API fails
        const sampleContest = sampleContests.find(c => c.id === contestId);
        setContest(sampleContest);
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [contestId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading Contest...</h1>
          <p className="text-gray-400">Please wait while we fetch the contest details.</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Contest Not Found</h1>
          <p className="text-gray-400 mb-6">The contest you're looking for doesn't exist.</p>
          <Link
            to="/contests"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getContestStatus(contest);
  const timeLeft = getTimeLeft(contest.submission_deadline);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced':
        return 'bg-orange-500/20 text-orange-400';
      case 'expert':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'gaming':
        return '🎮';
      case 'defi':
        return '💰';
      case 'art':
        return '🎨';
      case 'governance':
        return '🏛️';
      case 'education':
        return '📚';
      default:
        return '🏆';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        ...submissionData,
        contest_id: contest.id,
        submitter_address: userAddress
      });
    }
    setShowSubmissionForm(false);
    setSubmissionData({ title: '', description: '', content: '', content_type: 'text' });
  };

  const handleMintPoINFT = async () => {
    console.log('handleMintPoINFT called, userAddress:', userAddress);
    
    if (!userAddress) {
      setModalMessage('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setModalMessage('');

    try {
      const requestBody = {
        address: userAddress,
        signature: '0x' + Array(130).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        message: nftData.message || `Mint PoI NFT for contest ${contest.id}`,
        contestId: contest.id
      };
      
      console.log('PoI NFT request body:', requestBody);
      
      const response = await fetch('http://localhost:8000/api/poi/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
        setModalMessage('✅ PoI NFT minted successfully!');
        setShowNFTModal(false);
        setNftData({ message: '', signature: '' });
      } else {
        setModalMessage(`❌ Failed to mint PoI NFT: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error minting PoI NFT:', error);
      setModalMessage('❌ Error minting PoI NFT. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async () => {
    console.log('handleVote called, userAddress:', userAddress);
    console.log('votingData:', votingData);
    
    if (!userAddress) {
      setModalMessage('Please connect your wallet first');
      return;
    }

    if (!votingData.selectedEntry || !votingData.justification) {
      setModalMessage('Please select an entry and provide justification');
      return;
    }

    setIsLoading(true);
    setModalMessage('');

    try {
      // First create a voting session if it doesn't exist
      await fetch('http://localhost:8002/api/voting/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: contest.id,
          config: { maxUpvotes: 5, maxDownvotes: 2 }
        })
      });

      // Commit vote
      const voteCommitResponse = await fetch('http://localhost:8002/api/voting/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: contest.id,
          voterAddress: userAddress,
          commitHash: '0x' + Math.random().toString(16).substr(2, 64),
          salt: Math.random().toString(36)
        })
      });

      if (voteCommitResponse.ok) {
        setModalMessage('✅ Vote committed successfully!');
        setShowVotingModal(false);
        setVotingData({ selectedEntry: '', voteType: 'upvote', justification: '' });
      } else {
        setModalMessage('❌ Failed to commit vote. Please try again.');
      }
    } catch (error) {
      console.error('Error voting:', error);
      setModalMessage('❌ Error submitting vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDispute = async () => {
    console.log('handleFileDispute called, userAddress:', userAddress);
    console.log('disputeData:', disputeData);
    
    if (!userAddress) {
      setModalMessage('Please connect your wallet first');
      return;
    }

    if (!disputeData.explanation || disputeData.explanation.length < 20) {
      setModalMessage('Please provide a detailed explanation (minimum 20 characters)');
      return;
    }

    setIsLoading(true);
    setModalMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/dispute/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: contest.id,
          entryId: disputeData.entryId || 'entry-' + Math.random().toString(36).substr(2, 9),
          reasonCode: disputeData.reasonCode,
          explanation: disputeData.explanation,
          evidence: disputeData.evidence ? [disputeData.evidence] : [],
          filerAddress: userAddress,
          isAnonymous: false
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setModalMessage('✅ Dispute filed successfully!');
        setShowDisputeModal(false);
        setDisputeData({ entryId: '', reasonCode: 'A8', explanation: '', evidence: '' });
      } else {
        setModalMessage(`❌ Failed to file dispute: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error filing dispute:', error);
      setModalMessage('❌ Error filing dispute. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmissions = () => {
    window.location.href = `/voting/${contest.id}#submissions`;
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-dark-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-dark-700">
          <div className="p-6 border-b border-dark-700">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Success/Error Message */}
      {modalMessage && (
        <div className="fixed top-4 right-4 z-50 bg-dark-800 border border-dark-600 rounded-lg p-4 max-w-md">
          <div className="flex justify-between items-start">
            <p className="text-white">{modalMessage}</p>
            <button
              onClick={() => setModalMessage('')}
              className="text-gray-400 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/contests"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Contests
          </Link>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{getCategoryIcon(contest.category)}</span>
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.phase}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {formatReward(contest.reward_amount, contest.reward_token)}
              </div>
              <div className="text-sm text-gray-400">Total Reward</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">{contest.title}</h1>
          
          <div className="flex items-center space-x-4 mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(contest.difficulty)}`}>
              {contest.difficulty}
            </span>
            <span className="text-gray-400">{contest.category}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{timeLeft}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6 border border-dark-700">
          <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
          <p className="text-gray-300 leading-relaxed">{contest.description}</p>
        </div>

        {/* Rules */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6 border border-dark-700">
          <h2 className="text-xl font-semibold text-white mb-4">Rules & Requirements</h2>
          <ul className="space-y-2">
            {contest.rules.map((rule, index) => (
              <li key={index} className="flex items-start text-gray-300">
                <span className="text-primary mr-2 mt-1">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6 border border-dark-700">
          <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {contest.tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-dark-700 text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 text-center">
            <div className="text-2xl font-bold text-white">{contest.total_submissions}</div>
            <div className="text-sm text-gray-400">Submissions</div>
          </div>
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 text-center">
            <div className="text-2xl font-bold text-white">{contest.total_votes}</div>
            <div className="text-sm text-gray-400">Votes</div>
          </div>
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 text-center">
            <div className="text-2xl font-bold text-white">
              {new Date(contest.submission_deadline).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-400">Deadline</div>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-dark-800 rounded-lg p-4 mb-6 border border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-2">Debug Info</h3>
            <p className="text-gray-300">
              <strong>User Address:</strong> {userAddress || 'Not connected'}
            </p>
            <p className="text-gray-300">
              <strong>Contest Status:</strong> {statusInfo.status}
            </p>
            <p className="text-gray-300">
              <strong>Contest ID:</strong> {contest.id}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userAddress && statusInfo.status === 'active' && (
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Submit Entry
            </button>
          )}
          
          {userAddress && statusInfo.status === 'voting' && (
            <>
              <button 
                onClick={() => setShowVotingModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                🗳️ Vote Now
              </button>
              <button 
                onClick={() => setShowNFTModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                🎫 Mint PoI NFT
              </button>
            </>
          )}
          
          <button 
            onClick={() => handleViewSubmissions()}
            className="px-6 py-3 bg-dark-800 text-gray-300 border border-dark-600 rounded-lg font-medium hover:bg-dark-700 transition-colors"
          >
            View Submissions
          </button>
          
          <button 
            onClick={() => setShowDisputeModal(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            ⚖️ File Dispute
          </button>
        </div>

        {/* Voting Modal */}
        <Modal isOpen={showVotingModal} onClose={() => setShowVotingModal(false)} title="Vote Now">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Entry to Vote On
              </label>
              <select
                value={votingData.selectedEntry}
                onChange={(e) => setVotingData({...votingData, selectedEntry: e.target.value})}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Choose an entry...</option>
                <option value="entry-1">Entry 1: DeFi Protocol</option>
                <option value="entry-2">Entry 2: NFT Marketplace</option>
                <option value="entry-3">Entry 3: DAO Governance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vote Type
              </label>
              <select
                value={votingData.voteType}
                onChange={(e) => setVotingData({...votingData, voteType: e.target.value})}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="upvote">👍 Upvote</option>
                <option value="downvote">👎 Downvote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Justification *
              </label>
              <textarea
                value={votingData.justification}
                onChange={(e) => setVotingData({...votingData, justification: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Explain your vote..."
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-dark-700">
              <button
                onClick={() => setShowVotingModal(false)}
                className="px-6 py-3 bg-dark-700 text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Voting...' : 'Submit Vote'}
              </button>
            </div>
          </div>
        </Modal>

        {/* PoI NFT Modal */}
        <Modal isOpen={showNFTModal} onClose={() => setShowNFTModal(false)} title="Mint PoI NFT">
          <div className="space-y-4">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-blue-400 text-xl mr-2">ℹ️</span>
                <h4 className="text-blue-400 font-semibold">Proof of Identity NFT</h4>
              </div>
              <p className="text-blue-200 text-sm">
                This NFT proves your identity and enables voting privileges on Ranqly. 
                Each user can only mint one PoI NFT.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={nftData.message}
                onChange={(e) => setNftData({...nftData, message: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Optional message for your PoI NFT..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-dark-700">
              <button
                onClick={() => setShowNFTModal(false)}
                className="px-6 py-3 bg-dark-700 text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMintPoINFT}
                disabled={isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Minting...' : 'Mint PoI NFT'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Dispute Modal */}
        <Modal isOpen={showDisputeModal} onClose={() => setShowDisputeModal(false)} title="File Dispute">
          <div className="space-y-4">
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-red-400 text-xl mr-2">⚠️</span>
                <h4 className="text-red-400 font-semibold">Important Notice</h4>
              </div>
              <p className="text-red-200 text-sm">
                Filing false disputes may result in penalties. Please ensure your dispute is legitimate and well-documented.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Entry ID (Optional)
              </label>
              <input
                type="text"
                value={disputeData.entryId}
                onChange={(e) => setDisputeData({...disputeData, entryId: e.target.value})}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Leave empty for general contest dispute"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason Code
              </label>
              <select
                value={disputeData.reasonCode}
                onChange={(e) => setDisputeData({...disputeData, reasonCode: e.target.value})}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="A1">A1: Plagiarism/duplicate content</option>
                <option value="A2">A2: Off-brief/irrelevant to contest theme</option>
                <option value="A3">A3: Rule violation (inappropriate content)</option>
                <option value="A4">A4: Spam or low-effort submission</option>
                <option value="A5">A5: Technical issues (broken links, etc.)</option>
                <option value="A6">A6: False claims or misleading information</option>
                <option value="A7">A7: Copyright infringement</option>
                <option value="A8">A8: Other (specify in explanation)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Detailed Explanation *
              </label>
              <textarea
                value={disputeData.explanation}
                onChange={(e) => setDisputeData({...disputeData, explanation: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Provide detailed explanation of the issue (minimum 20 characters)..."
                required
              />
              <div className="text-sm text-gray-400 mt-1">
                Character count: {disputeData.explanation.length}/20 minimum
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Evidence (Optional)
              </label>
              <textarea
                value={disputeData.evidence}
                onChange={(e) => setDisputeData({...disputeData, evidence: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Links, screenshots, or other evidence..."
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-dark-700">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-6 py-3 bg-dark-700 text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFileDispute}
                disabled={isLoading || disputeData.explanation.length < 20}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Filing...' : 'File Dispute'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Submission Form Modal */}
        {showSubmissionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-dark-700">
              <div className="p-6 border-b border-dark-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Submit Your Entry</h3>
                  <button
                    onClick={() => setShowSubmissionForm(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Entry Title *
                    </label>
                    <input
                      type="text"
                      value={submissionData.title}
                      onChange={(e) => setSubmissionData({...submissionData, title: e.target.value})}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter your entry title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={submissionData.description}
                      onChange={(e) => setSubmissionData({...submissionData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Brief description of your entry"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Content Type *
                      </label>
                      <select
                        value={submissionData.content_type}
                        onChange={(e) => setSubmissionData({...submissionData, content_type: e.target.value})}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="text">Text/Article</option>
                        <option value="video">Video</option>
                        <option value="image">Image/Design</option>
                        <option value="code">Code</option>
                        <option value="mixed">Mixed Media</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Word Count
                      </label>
                      <input
                        type="number"
                        value={submissionData.word_count}
                        onChange={(e) => setSubmissionData({...submissionData, word_count: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Content</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Main Content *
                    </label>
                    <textarea
                      value={submissionData.content}
                      onChange={(e) => {
                        const content = e.target.value;
                        const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
                        setSubmissionData({
                          ...submissionData, 
                          content: content,
                          word_count: wordCount
                        });
                      }}
                      rows={8}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your main content goes here... (Minimum 100 words)"
                      required
                    />
                    <div className="text-sm text-gray-400 mt-1">
                      Word count: {submissionData.word_count} 
                      {contest?.min_word_count && ` (Minimum: ${contest.min_word_count})`}
                      {contest?.max_word_count && ` (Maximum: ${contest.max_word_count})`}
                    </div>
                  </div>
                </div>

                {/* Agreements */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Agreements</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={submissionData.originality_statement}
                        onChange={(e) => setSubmissionData({...submissionData, originality_statement: e.target.checked})}
                        className="mt-1 w-4 h-4 text-primary bg-dark-700 border-dark-600 rounded focus:ring-primary"
                        required
                      />
                      <span className="text-sm text-gray-300">
                        I certify that this submission is my original work and does not infringe on any copyrights or intellectual property rights. *
                      </span>
                    </label>

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={submissionData.terms_accepted}
                        onChange={(e) => setSubmissionData({...submissionData, terms_accepted: e.target.checked})}
                        className="mt-1 w-4 h-4 text-primary bg-dark-700 border-dark-600 rounded focus:ring-primary"
                        required
                      />
                      <span className="text-sm text-gray-300">
                        I agree to the contest terms and conditions and understand that my submission will be evaluated according to the contest rules. *
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-dark-700">
                  <button
                    type="button"
                    onClick={() => setShowSubmissionForm(false)}
                    className="px-6 py-3 bg-dark-700 text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!submissionData.originality_statement || !submissionData.terms_accepted}
                  >
                    Submit Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestDetails;