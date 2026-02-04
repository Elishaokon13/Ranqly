import { ethers, network } from "hardhat";

async function main() {
  console.log(`Deploying contracts to ${network.name}...`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deployment parameters
  const MINT_PRICE = ethers.utils.parseEther("0.001"); // 0.001 ETH for testing

  // Deploy PoI Voting NFT
  console.log("\nDeploying PoI Voting NFT...");
  const PoIVotingNFTFactory = await ethers.getContractFactory("PoIVotingNFT");
  const poiNFT = await PoIVotingNFTFactory.deploy(deployer.address, MINT_PRICE);
  await poiNFT.deployed();
  console.log("PoI Voting NFT deployed to:", poiNFT.address);

  // Deploy Contest Vault
  console.log("\nDeploying Contest Vault...");
  const ContestVaultFactory = await ethers.getContractFactory("ContestVault");
  const contestVault = await ContestVaultFactory.deploy();
  await contestVault.deployed();
  console.log("Contest Vault deployed to:", contestVault.address);

  // Deploy Commit-Reveal Voting
  console.log("\nDeploying Commit-Reveal Voting...");
  const CommitRevealVotingFactory = await ethers.getContractFactory("CommitRevealVoting");
  const votingContract = await CommitRevealVotingFactory.deploy(poiNFT.address);
  await votingContract.deployed();
  console.log("Commit-Reveal Voting deployed to:", votingContract.address);

  // Deploy Contest Registry
  console.log("\nDeploying Contest Registry...");
  const ContestRegistryFactory = await ethers.getContractFactory("ContestRegistry");
  const contestRegistry = await ContestRegistryFactory.deploy(contestVault.address, votingContract.address);
  await contestRegistry.deployed();
  console.log("Contest Registry deployed to:", contestRegistry.address);

  // Set up roles and permissions
  console.log("\nSetting up roles and permissions...");
  
  // Add deployer as organizer and oracle in vault
  await contestVault.addOrganizer(deployer.address);
  await contestVault.addOracle(deployer.address);
  console.log("Added deployer as organizer and oracle in vault");
  
  // Add deployer as oracle in registry
  await contestRegistry.addOracle(deployer.address);
  console.log("Added deployer as oracle in registry");

  // Verify deployments
  console.log("\nVerifying deployments...");
  console.log("PoI NFT name:", await poiNFT.name());
  console.log("PoI NFT symbol:", await poiNFT.symbol());
  console.log("PoI NFT mint price:", ethers.utils.formatEther(await poiNFT.mintPrice()));
  console.log("Contest Vault owner:", await contestVault.owner());
  console.log("Voting Contract owner:", await votingContract.owner());
  console.log("Registry owner:", await contestRegistry.owner());

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: {
      PoIVotingNFT: {
        address: poiNFT.address,
        transactionHash: poiNFT.deployTransaction.hash,
        blockNumber: poiNFT.deployTransaction.blockNumber,
      },
      ContestVault: {
        address: contestVault.address,
        transactionHash: contestVault.deployTransaction.hash,
        blockNumber: contestVault.deployTransaction.blockNumber,
      },
      CommitRevealVoting: {
        address: votingContract.address,
        transactionHash: votingContract.deployTransaction.hash,
        blockNumber: votingContract.deployTransaction.blockNumber,
      },
      ContestRegistry: {
        address: contestRegistry.address,
        transactionHash: contestRegistry.deployTransaction.hash,
        blockNumber: contestRegistry.deployTransaction.blockNumber,
      },
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for reference
  const fs = require("fs");
  const deploymentFile = `deployments/${network.name}-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // Create environment file for frontend/backend
  const envContent = `
# Ranqly Contract Addresses - ${network.name.toUpperCase()}
POI_NFT_CONTRACT_ADDRESS=${poiNFT.address}
CONTEST_VAULT_CONTRACT_ADDRESS=${contestVault.address}
COMMIT_REVEAL_VOTING_CONTRACT_ADDRESS=${votingContract.address}
CONTEST_REGISTRY_CONTRACT_ADDRESS=${contestRegistry.address}

# Network Configuration
BLOCKCHAIN_RPC_URL=${network.config.url || 'http://localhost:8545'}
CHAIN_ID=${network.config.chainId}
NETWORK_NAME=${network.name}
`;

  const envFile = `.env.${network.name}`;
  fs.writeFileSync(envFile, envContent);
  console.log(`\nEnvironment file created: ${envFile}`);

  // Instructions for next steps
  console.log("\nNext steps:");
  console.log("1. Verify contracts on block explorer (if on mainnet/testnet)");
  console.log("2. Update frontend configuration with contract addresses");
  console.log("3. Update API configuration with contract addresses");
  console.log("4. Test contract interactions");
  console.log("5. Set up monitoring and alerts");
  console.log("6. Deploy contracts to testnet/mainnet for production");

  // Test basic functionality
  console.log("\nTesting basic functionality...");
  
  // Test PoI NFT minting
  const emptyProof: string[] = [];
  const mintTx = await poiNFT.connect(deployer).mintPoI(deployer.address, emptyProof, { value: MINT_PRICE });
  await mintTx.wait();
  console.log("✅ PoI NFT minted successfully");
  
  // Test contest creation
  const contestId = ethers.utils.id("test-contest-" + Date.now());
  const createContestTx = await contestRegistry.createContest(
    contestId,
    {
      title: "Test Contest",
      description: "A test contest for deployment verification",
      rules: "Basic test rules",
      algoWeight: 40,
      communityWeight: 30,
      judgeWeight: 30,
      maxSubmissions: 100,
      minVotesRequired: 10,
      judgeCount: 3
    },
    ethers.utils.parseEther("1.0"),
    ethers.constants.AddressZero, // ETH
    Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
    Math.floor(Date.now() / 1000) + 10800, // 3 hours from now
    Math.floor(Date.now() / 1000) + 14400, // 4 hours from now
    Math.floor(Date.now() / 1000) + 18000, // 5 hours from now
    Math.floor(Date.now() / 1000) + 21600  // 6 hours from now
  );
  await createContestTx.wait();
  console.log("✅ Test contest created successfully");

  return {
    poiNFT,
    contestVault,
    votingContract,
    contestRegistry,
    deploymentInfo,
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
