// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPoIVotingNFT
 * @dev Interface for Proof of Identity (PoI) Voting NFT
 * @notice Defines the interface for soulbound NFTs used in voting
 */
interface IPoIVotingNFT {
    // Events
    event PoIVerified(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event PoIRevoked(address indexed user, uint256 indexed tokenId, string reason);
    event VotingPowerUpdated(address indexed user, uint256 oldPower, uint256 newPower);
    
    // Structs
    struct PoIInfo {
        address user;
        uint256 verificationTimestamp;
        uint256 votingPower;
        bool isActive;
        string metadataHash;
    }
    
    // Functions
    function mintPoI(
        address to,
        uint256 votingPower,
        string calldata metadataHash
    ) external returns (uint256);
    
    function revokePoI(uint256 tokenId, string calldata reason) external;
    
    function updateVotingPower(uint256 tokenId, uint256 newPower) external;
    
    function getPoIInfo(uint256 tokenId) external view returns (PoIInfo memory);
    
    function getUserPoI(address user) external view returns (uint256);
    
    function getVotingPower(address user) external view returns (uint256);
    
    function isPoIValid(address user) external view returns (bool);
    
    function isHolder(address user) external view returns (bool);
    
    function getActivePoICount() external view returns (uint256);
}
