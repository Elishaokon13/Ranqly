// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title PoIVotingNFT
 * @dev Proof-of-Impact Voting NFT - Soulbound token for voting rights
 * 
 * Key Features:
 * - Non-transferable (soulbound) - can only be minted, burned, or approved to zero address
 * - One NFT per address maximum
 * - Mint window control for contest registration
 * - Anti-sybil mechanisms
 * - Voting eligibility enforcement
 * 
 * Based on Ranqly Whitepaper specifications for one-person-one-vote system
 */
contract PoIVotingNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Burnable, 
    Ownable, 
    Pausable, 
    ReentrancyGuard 
{
    using Counters for Counters.Counter;
    using ECDSA for bytes32;

    // Token counter
    Counters.Counter private _tokenIds;

    // Mint configuration
    uint256 public mintFee;
    uint256 public maxSupply;
    uint256 public mintWindowStart;
    uint256 public mintWindowEnd;
    
    // Anti-sybil mechanisms
    mapping(address => bool) public hasMinted;
    mapping(address => bool) public authorizedMinters;
    mapping(bytes32 => bool) public usedSignatures;
    
    // Contest-specific data
    string public contestId;
    string public contestMetadataURI;
    
    // Events
    event PoIMinted(address indexed to, uint256 indexed tokenId, uint256 mintFee);
    event PoIBurned(address indexed from, uint256 indexed tokenId);
    event MintWindowUpdated(uint256 start, uint256 end);
    event MintFeeUpdated(uint256 newFee);
    event ContestConfigured(string contestId, string metadataURI);
    
    // Errors
    error AlreadyMinted();
    error MintWindowNotOpen();
    error MintWindowClosed();
    error MaxSupplyExceeded();
    error InsufficientMintFee();
    error UnauthorizedMinter();
    error SoulboundToken();
    error InvalidSignature();
    error SignatureAlreadyUsed();

    constructor(
        string memory name,
        string memory symbol,
        uint256 _mintFee,
        uint256 _maxSupply,
        address _owner
    ) ERC721(name, symbol) {
        mintFee = _mintFee;
        maxSupply = _maxSupply;
        _transferOwnership(_owner);
    }

    /**
     * @dev Configure contest parameters
     * @param _contestId Contest identifier
     * @param _metadataURI Contest metadata URI
     */
    function configureContest(
        string memory _contestId,
        string memory _metadataURI
    ) external onlyOwner {
        contestId = _contestId;
        contestMetadataURI = _metadataURI;
        emit ContestConfigured(_contestId, _metadataURI);
    }

    /**
     * @dev Set mint window for contest registration
     * @param _start Start timestamp
     * @param _end End timestamp
     */
    function setMintWindow(uint256 _start, uint256 _end) external onlyOwner {
        require(_start < _end, "Invalid mint window");
        mintWindowStart = _start;
        mintWindowEnd = _end;
        emit MintWindowUpdated(_start, _end);
    }

    /**
     * @dev Update mint fee
     * @param _newFee New mint fee in wei
     */
    function setMintFee(uint256 _newFee) external onlyOwner {
        mintFee = _newFee;
        emit MintFeeUpdated(_newFee);
    }

    /**
     * @dev Mint PoI NFT with signature verification for anti-sybil
     * @param signature Signature from authorized minter
     * @param nonce Unique nonce for signature
     */
    function mintPoI(
        bytes memory signature,
        uint256 nonce
    ) external payable nonReentrant whenNotPaused {
        // Check if user already has a PoI NFT
        if (hasMinted[msg.sender]) {
            revert AlreadyMinted();
        }

        // Check mint window
        if (block.timestamp < mintWindowStart) {
            revert MintWindowNotOpen();
        }
        if (block.timestamp > mintWindowEnd) {
            revert MintWindowClosed();
        }

        // Check max supply
        if (_tokenIds.current() >= maxSupply) {
            revert MaxSupplyExceeded();
        }

        // Check mint fee
        if (msg.value < mintFee) {
            revert InsufficientMintFee();
        }

        // Verify signature for anti-sybil protection
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            address(this),
            nonce,
            block.chainid
        ));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        if (!authorizedMinters[signer]) {
            revert UnauthorizedMinter();
        }

        // Check signature hasn't been used
        bytes32 signatureHash = keccak256(signature);
        if (usedSignatures[signatureHash]) {
            revert SignatureAlreadyUsed();
        }
        usedSignatures[signatureHash] = true;

        // Mint the NFT
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, contestMetadataURI);
        
        hasMinted[msg.sender] = true;

        emit PoIMinted(msg.sender, tokenId, mintFee);
    }

    /**
     * @dev Check if address has voting eligibility
     * @param voter Address to check
     * @return True if address owns a PoI NFT
     */
    function hasVotingRights(address voter) external view returns (bool) {
        return balanceOf(voter) > 0;
    }

    /**
     * @dev Get total number of minted PoI NFTs
     * @return Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @dev Add authorized minter for signature verification
     * @param minter Address to authorize
     */
    function addAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }

    /**
     * @dev Remove authorized minter
     * @param minter Address to remove authorization
     */
    function removeAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }

    /**
     * @dev Pause contract for emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Soulbound token implementation - override transfer functions
    
    /**
     * @dev Override transferFrom to prevent transfers (soulbound)
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAllowedTransfer(from, to) {
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev Override safeTransferFrom to prevent transfers (soulbound)
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAllowedTransfer(from, to) {
        super.safeTransferFrom(from, to, tokenId);
    }

    /**
     * @dev Override safeTransferFrom with data to prevent transfers (soulbound)
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override onlyAllowedTransfer(from, to) {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    /**
     * @dev Modifier to allow only specific transfers (burning, minting)
     */
    modifier onlyAllowedTransfer(address from, address to) {
        // Allow transfers to zero address (burning)
        if (to == address(0)) {
            _;
        }
        // Allow transfers from zero address (minting)
        else if (from == address(0)) {
            _;
        }
        // Revert all other transfers (soulbound)
        else {
            revert SoulboundToken();
        }
    }

    // Override required functions

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        emit PoIBurned(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}