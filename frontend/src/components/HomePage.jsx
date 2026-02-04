import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../services/api';

const HomePage = ({ userAddress, onConnect, onCreateContest }) => {
  const [activeContests, setActiveContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveContests();
  }, []);

  const loadActiveContests = async () => {
    try {
      const data = await ApiService.getContests();
      const active = (data.contests || []).filter(c => c.status === 'active').slice(0, 6);
      setActiveContests(active);
    } catch (error) {
      console.error('Failed to load active contests:', error);
      // Use mock data as fallback
      const mockData = ApiService.getMockContests();
      setActiveContests(mockData.contests.filter(c => c.status === 'active').slice(0, 6));
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getPhaseBadge = (contest) => {
    const now = new Date();
    const submissionEnd = new Date(contest.submission_deadline);
    const votingEnd = new Date(contest.voting_deadline);
    
    if (now < submissionEnd) {
      return { text: 'Submissions Open', color: 'bg-blue-100 text-blue-800' };
    } else if (now < votingEnd) {
      return { text: 'Voting Live', color: 'bg-purple-100 text-purple-800' };
    } else {
      return { text: 'Finalizing', color: 'bg-orange-100 text-orange-800' };
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              The fair content layer for Web3
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
              Run transparent, auditable content bounties powered by algorithmic scoring, 
              community voting, and anonymous judging.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button
                onClick={() => {
                  if (!userAddress) {
                    onConnect();
                  } else {
                    onCreateContest();
                  }
                }}
                className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-100 transition-colors w-full sm:w-auto"
              >
                Launch a Contest
              </button>
              <Link
                to="/contests"
                className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors w-full sm:w-auto text-center"
              >
                Explore Contests
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to fair, transparent content contests
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">📝</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4">Submit</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Creators submit content URLs or upload files. We automatically create 
                immutable snapshots and compute initial quality scores.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">🎯</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4">Score</h3>
              <p className="text-sm sm:text-base text-gray-600">
                AI algorithms analyze content quality, community voting with commit-reveal 
                privacy, and anonymous expert judging determine final rankings.
              </p>
            </div>
            
            <div className="text-center sm:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl">🏆</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4">Reward</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Winners receive automated payouts through smart contracts. 
                All decisions are transparent with downloadable audit packs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Ranqly</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for trust, transparency, and fairness in Web3 content
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Scoring</h3>
              <p className="text-gray-600">
                Advanced NLP algorithms analyze content quality, originality, and engagement 
                with explainable scoring breakdowns.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Proof-of-Impact NFT</h3>
              <p className="text-gray-600">
                Soulbound NFTs prevent Sybil attacks and ensure only genuine community 
                members can vote in contests.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Anonymous Judging</h3>
              <p className="text-gray-600">
                Expert judges provide unbiased evaluations without knowing creator 
                identities or community voting patterns.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Dispute System</h3>
              <p className="text-gray-600">
                Community can challenge entries for plagiarism, off-brief content, 
                or other violations with transparent resolution.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">On-Chain Cache</h3>
              <p className="text-gray-600">
                Content snapshots are permanently stored on IPFS/Arweave with 
                cryptographic proofs for immutable record-keeping.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">ContestVault</h3>
              <p className="text-gray-600">
                Multisig vaults secure prize pools with transparent funding 
                and automated payout execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Contests Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Active Contests</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join the community and participate in ongoing contests
            </p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : activeContests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activeContests.map(contest => {
                const badge = getPhaseBadge(contest);
                return (
                  <div key={contest.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2 sm:gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{contest.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{contest.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">Prize Pool</div>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{contest.reward_amount} ETH</div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">Time Left</div>
                        <div className="text-base sm:text-lg font-semibold text-gray-900">{formatTimeLeft(contest.voting_deadline)}</div>
                      </div>
                      
                      <Link
                        to={`/contests/${contest.id}`}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors block text-center"
                      >
                        View Contest
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Contests</h3>
              <p className="text-gray-500 mb-6">Be the first to launch a contest on Ranqly!</p>
              <button
                onClick={() => {
                  if (!userAddress) {
                    onConnect();
                  } else {
                    onCreateContest();
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Launch First Contest
              </button>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link
              to="/contests"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View all contests →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">
            Ready to launch your first contest?
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90">
            Create transparent, auditable content bounties in minutes with our easy-to-use platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button
              onClick={() => {
                if (!userAddress) {
                  onConnect();
                } else {
                  onCreateContest();
                }
              }}
              className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-gray-100 transition-colors w-full sm:w-auto"
            >
              Get Started Free
            </button>
            <Link
              to="/docs"
              className="border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors w-full sm:w-auto text-center"
            >
              Read Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
