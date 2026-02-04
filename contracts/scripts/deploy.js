const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting Ranqly Smart Contract Deployment...\n");

    // Get the contract factory
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy PoI Voting NFT
    console.log("\n📜 Deploying PoI Voting NFT...");
    const PoIVotingNFT = await ethers.getContractFactory("PoIVotingNFT");
    const poiNFT = await PoIVotingNFT.deploy(
        "Ranqly PoI Voting NFT",
        "RANQPOI",
        ethers.utils.parseEther("0.01"), // 0.01 ETH mint fee
        10000, // Max supply
        deployer.address // Owner
    );
    await poiNFT.deployed();
    console.log("✅ PoI Voting NFT deployed to:", poiNFT.address);

    // Deploy Contest Vault
    console.log("\n🏦 Deploying Contest Vault...");
    const ContestVault = await ethers.getContractFactory("ContestVault");
    const contestVault = await ContestVault.deploy(
        deployer.address, // Ranqly Oracle (using deployer for now)
        deployer.address, // Organizer
        86400 // 24 hours signature timeout
    );
    await contestVault.deployed();
    console.log("✅ Contest Vault deployed to:", contestVault.address);

    // Deploy Commit-Reveal Voting
    console.log("\n🗳️ Deploying Commit-Reveal Voting...");
    const CommitRevealVoting = await ethers.getContractFactory("CommitRevealVoting");
    const commitRevealVoting = await CommitRevealVoting.deploy();
    await commitRevealVoting.deployed();
    console.log("✅ Commit-Reveal Voting deployed to:", commitRevealVoting.address);

    // Configure PoI NFT with contest parameters
    console.log("\n⚙️ Configuring PoI NFT...");
    const contestId = "ranqly-contest-001";
    const metadataURI = "https://api.ranqly.com/metadata/poi/contest-001";
    
    await poiNFT.configureContest(contestId, metadataURI);
    
    // Set mint window (24 hours from now)
    const mintStart = Math.floor(Date.now() / 1000);
    const mintEnd = mintStart + (24 * 60 * 60); // 24 hours
    await poiNFT.setMintWindow(mintStart, mintEnd);
    
    // Add deployer as authorized minter
    await poiNFT.addAuthorizedMinter(deployer.address);
    
    console.log("✅ PoI NFT configured with contest:", contestId);
    console.log("   Mint window:", new Date(mintStart * 1000), "to", new Date(mintEnd * 1000));

    // Create a sample contest vault
    console.log("\n💰 Creating sample contest...");
    const totalReward = ethers.utils.parseEther("1.0"); // 1 ETH
    const rewardDistribution = [5000, 3000, 2000]; // 50%, 30%, 20%
    const finalizationDeadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
    
    await contestVault.createContest(
        contestId,
        ethers.constants.AddressZero, // ETH
        totalReward,
        rewardDistribution,
        finalizationDeadline,
        { value: totalReward }
    );
    
    console.log("✅ Sample contest created with 1 ETH reward pool");

    // Create a sample voting contest
    console.log("\n🗳️ Creating sample voting contest...");
    const entryIds = ["entry-001", "entry-002", "entry-003"];
    const commitStart = Math.floor(Date.now() / 1000) + (2 * 60 * 60); // 2 hours from now
    const commitEnd = commitStart + (24 * 60 * 60); // 24 hours commit phase
    const revealStart = commitEnd + (1 * 60 * 60); // 1 hour gap
    const revealEnd = revealStart + (24 * 60 * 60); // 24 hours reveal phase
    
    await commitRevealVoting.createContest(
        contestId,
        poiNFT.address,
        commitStart,
        commitEnd,
        revealStart,
        revealEnd,
        5, // Max upvotes
        2, // Max downvotes
        entryIds
    );
    
    console.log("✅ Sample voting contest created");

    // Deployment summary
    console.log("\n🎉 Deployment Complete!");
    console.log("=====================================");
    console.log("📜 PoI Voting NFT:", poiNFT.address);
    console.log("🏦 Contest Vault:", contestVault.address);
    console.log("🗳️ Commit-Reveal Voting:", commitRevealVoting.address);
    console.log("\n📋 Configuration:");
    console.log("   Contest ID:", contestId);
    console.log("   Mint Fee: 0.01 ETH");
    console.log("   Max Supply: 10,000 NFTs");
    console.log("   Reward Pool: 1 ETH");
    console.log("   Distribution: 50% / 30% / 20%");
    console.log("\n🔗 Network: Hardhat Local");
    console.log("📅 Deployed at:", new Date().toISOString());

    // Save deployment addresses
    const deploymentInfo = {
        network: "hardhat",
        timestamp: new Date().toISOString(),
        contracts: {
            PoIVotingNFT: poiNFT.address,
            ContestVault: contestVault.address,
            CommitRevealVoting: commitRevealVoting.address
        },
        configuration: {
            contestId,
            mintFee: "0.01 ETH",
            maxSupply: 10000,
            totalReward: "1.0 ETH",
            rewardDistribution: [5000, 3000, 2000],
            mintWindow: {
                start: mintStart,
                end: mintEnd
            },
            votingWindow: {
                commitStart,
                commitEnd,
                revealStart,
                revealEnd
            }
        }
    };

    console.log("\n💾 Deployment info saved to deployment.json");
    require('fs').writeFileSync(
        './deployment.json',
        JSON.stringify(deploymentInfo, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });