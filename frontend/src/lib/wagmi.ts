import { configureChains, createConfig } from 'wagmi'
import { polygon, polygonMumbai, optimism, arbitrum } from 'wagmi/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { InjectedConnector } from 'wagmi/connectors/injected'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    polygon,
    ...(import.meta.env.VITE_ENVIRONMENT === 'development' ? [polygonMumbai] : []),
    optimism,
    arbitrum,
  ],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://polygon-rpc.com`,
      }),
    }),
  ],
)

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export const supportedChains = chains

export const defaultChain = polygon

// Contract addresses for different networks
export const contractAddresses = {
  // PoI Voting NFT
  poiVotingNFT: {
    [polygon.id]: '0x...', // Deploy and update with actual addresses
    [optimism.id]: '0x...',
    [arbitrum.id]: '0x...',
  },
  // Contest Vault
  contestVault: {
    [polygon.id]: '0x...',
    [optimism.id]: '0x...',
    [arbitrum.id]: '0x...',
  },
  // Commit Reveal Voting
  commitRevealVoting: {
    [polygon.id]: '0x...',
    [optimism.id]: '0x...',
    [arbitrum.id]: '0x...',
  },
  // Contest Registry
  contestRegistry: {
    [polygon.id]: '0x...',
    [optimism.id]: '0x...',
    [arbitrum.id]: '0x...',
  },
} as const

// RPC URLs
export const rpcUrls = {
  [polygon.id]: 'https://polygon-rpc.com',
  [optimism.id]: 'https://mainnet.optimism.io',
  [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
} as const

// Block explorers
export const blockExplorers = {
  [polygon.id]: 'https://polygonscan.com',
  [optimism.id]: 'https://optimistic.etherscan.io',
  [arbitrum.id]: 'https://arbiscan.io',
} as const

// Gas settings
export const gasSettings = {
  [polygon.id]: {
    gasPrice: '20000000000', // 20 gwei
    maxFeePerGas: '30000000000', // 30 gwei
    maxPriorityFeePerGas: '5000000000', // 5 gwei
  },
  [optimism.id]: {
    gasPrice: '1000000', // 0.001 gwei
    maxFeePerGas: '2000000', // 0.002 gwei
    maxPriorityFeePerGas: '100000', // 0.0001 gwei
  },
  [arbitrum.id]: {
    gasPrice: '100000000', // 0.1 gwei
    maxFeePerGas: '200000000', // 0.2 gwei
    maxPriorityFeePerGas: '100000000', // 0.1 gwei
  },
} as const

// Helper functions
export const getContractAddress = (contractName: keyof typeof contractAddresses, chainId: number) => {
  return contractAddresses[contractName][chainId as keyof typeof contractAddresses[typeof contractName]]
}

export const getRpcUrl = (chainId: number) => {
  return rpcUrls[chainId as keyof typeof rpcUrls]
}

export const getBlockExplorer = (chainId: number) => {
  return blockExplorers[chainId as keyof typeof blockExplorers]
}

export const getGasSettings = (chainId: number) => {
  return gasSettings[chainId as keyof typeof gasSettings]
}
