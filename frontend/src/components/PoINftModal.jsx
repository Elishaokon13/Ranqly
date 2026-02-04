import React, { useState, useEffect } from 'react';
import PoINftService from '../services/poiNft';

const PoINftModal = ({ isOpen, onClose, userAddress }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Minting, 3: Success
  const [mintingFee, setMintingFee] = useState('0.01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [hasPoI, setHasPoI] = useState(false);

  useEffect(() => {
    if (isOpen && userAddress) {
      checkPoIStatus();
      loadMintingFee();
    }
  }, [isOpen, userAddress]);

  const checkPoIStatus = async () => {
    try {
      const status = await PoINftService.checkPoIStatus(userAddress);
      setHasPoI(status);
    } catch (error) {
      console.error('Error checking PoI status:', error);
    }
  };

  const loadMintingFee = async () => {
    try {
      const fee = await PoINftService.getMintingFee();
      setMintingFee(fee);
    } catch (error) {
      console.error('Error loading minting fee:', error);
    }
  };

  const handleMintPoI = async () => {
    setLoading(true);
    setError('');
    setStep(2);

    try {
      const result = await PoINftService.mintPoI(userAddress);
      
      if (result.success) {
        setSuccess(result);
        setStep(3);
        setHasPoI(true);
      } else {
        setError(result.error);
        setStep(1);
      }
    } catch (error) {
      setError('Failed to mint PoI NFT. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setError('');
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center border-b p-6">
          <h2 className="text-2xl font-bold text-gray-900">PoI NFT Minting</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {hasPoI ? (
                <div className="text-center py-8">
                  <div className="text-green-500 text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">You Already Have a PoI NFT!</h3>
                  <p className="text-gray-600 mb-6">
                    You already own a Proof of Identity NFT and can participate in voting.
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-6xl mb-4">🆔</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Proof of Identity NFT</h3>
                    <p className="text-gray-600">
                      Mint a PoI NFT to participate in voting and earn rewards on Ranqly.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">What is a PoI NFT?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Identity Verification:</strong> Proves you're a unique individual</li>
                      <li>• <strong>Voting Rights:</strong> Required to participate in contest voting</li>
                      <li>• <strong>Sybil Resistance:</strong> Prevents multiple accounts from same person</li>
                      <li>• <strong>Reward Eligibility:</strong> Needed to receive contest rewards</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Each wallet can only mint ONE PoI NFT</li>
                      <li>• Minting fee: <strong>{mintingFee} ETH</strong></li>
                      <li>• This NFT is soulbound (non-transferable)</li>
                      <li>• Required for voting in all contests</li>
                    </ul>
                  </div>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMintPoI}
                      disabled={loading}
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : `Mint PoI NFT (${mintingFee} ETH)`}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Minting Your PoI NFT</h3>
              <p className="text-gray-600 mb-4">
                Please confirm the transaction in your wallet and wait for confirmation.
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700">
                <p><strong>Transaction Status:</strong> Pending...</p>
                <p><strong>Gas Fee:</strong> Estimated ~0.002 ETH</p>
              </div>
            </div>
          )}

          {step === 3 && success && (
            <div className="text-center py-12">
              <div className="text-green-500 text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">PoI NFT Minted Successfully!</h3>
              <p className="text-gray-600 mb-6">
                Your Proof of Identity NFT has been minted and you can now participate in voting.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-green-900 mb-2">Transaction Details</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Token ID:</strong> {success.tokenId}</p>
                  <p><strong>Transaction Hash:</strong> {success.txHash}</p>
                  <p><strong>Status:</strong> Confirmed</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You can now vote in all contests</li>
                  <li>• Your votes will be weighted and counted</li>
                  <li>• You're eligible for contest rewards</li>
                  <li>• Your identity is protected and verified</li>
                </ul>
              </div>

              <button
                onClick={handleClose}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium"
              >
                Start Voting!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoINftModal;
