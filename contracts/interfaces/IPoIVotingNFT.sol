// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPoIVotingNFT
 * @dev Interface for the Proof of Identity Voting NFT
 */
interface IPoIVotingNFT {
    // Events
    event PoIMinted(address indexed to, uint256 indexed tokenId, uint256 price);
    event PoIRevoked(address indexed from, uint256 indexed tokenId, string reason);
    event MintPriceUpdated(uint256 newPrice);
    event SybilThresholdsUpdated(uint256 minBalance, uint256 minAge);
    event MerkleRootUpdated(bytes32 newRoot);

    // Functions
    function mintPoI(address to, bytes32[] calldata merkleProof) external payable;
    function isHolder(address account) external view returns (bool);
    function revokePoI(uint256 tokenId, string calldata reason) external;
    function restorePoI(uint256 tokenId) external;
    function updateMintPrice(uint256 newPrice) external;
    function updateSybilThresholds(uint256 _minBalance, uint256 _minAge) external;
    function updateMerkleRoot(bytes32 _merkleRoot, bool _useMerkleTree) external;
    function pause() external;
    function unpause() external;
    function withdraw() external;
    function withdrawERC20(address token) external;
    function totalSupply() external view returns (uint256);

    // View functions
    function mintPrice() external view returns (uint256);
    function hasMinted(address account) external view returns (bool);
    function mintedAt(address account) external view returns (uint256);
    function isRevoked(uint256 tokenId) external view returns (bool);
    function revokeReason(uint256 tokenId) external view returns (string memory);
    function minBalanceForMint() external view returns (uint256);
    function minAgeForMint() external view returns (uint256);
    function merkleRoot() external view returns (bytes32);
    function useMerkleTree() external view returns (bool);
}
