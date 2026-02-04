import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'

export function useAuth() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()
  
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    setUser, 
    setAuthenticated, 
    setLoading,
    clearAuth 
  } = useAuthStore()

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true)
      
      // Try to connect with the first available connector
      const connector = connectors[0]
      if (!connector) {
        throw new Error('No wallet connectors available')
      }

      await connect({ connector })
      
      toast({
        title: 'Wallet Connected',
        description: 'Your wallet has been connected successfully.',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [connect, connectors, toast, setLoading])

  const disconnectWallet = useCallback(async () => {
    try {
      setLoading(true)
      
      await disconnect()
      clearAuth()
      
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected.',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet'
      
      toast({
        title: 'Disconnection Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [disconnect, clearAuth, toast, setLoading])

  const signMessage = useCallback(async (message: string) => {
    if (!address) {
      throw new Error('No wallet connected')
    }

    try {
      setLoading(true)
      
      // This would typically use wagmi's useSignMessage hook
      // For now, we'll simulate the signing process
      const signature = await new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve('0x' + Math.random().toString(16).substr(2, 64))
        }, 1000)
      })

      return signature
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign message'
      
      toast({
        title: 'Signing Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [address, toast, setLoading])

  const verifySignature = useCallback(async (message: string, signature: string) => {
    if (!address) {
      throw new Error('No wallet connected')
    }

    try {
      // This would typically verify the signature against the message and address
      // For now, we'll simulate the verification process
      const isValid = await new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true) // Simulate successful verification
        }, 500)
      })

      if (isValid) {
        setAuthenticated(true)
        setUser({
          address,
          chainId,
          isVerified: true,
          lastLogin: new Date().toISOString(),
        })
      }

      return isValid
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify signature'
      
      toast({
        title: 'Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw err
    }
  }, [address, chainId, setAuthenticated, setUser, toast])

  const authenticate = useCallback(async () => {
    if (!isConnected || !address) {
      throw new Error('No wallet connected')
    }

    try {
      setLoading(true)
      
      const message = `Sign this message to authenticate with Ranqly.\n\nAddress: ${address}\nTimestamp: ${Date.now()}`
      const signature = await signMessage(message)
      const isValid = await verifySignature(message, signature)

      if (isValid) {
        toast({
          title: 'Authentication Successful',
          description: 'You have been authenticated successfully.',
        })
      }

      return isValid
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }, [isConnected, address, signMessage, verifySignature, toast, setLoading])

  const checkAuthentication = useCallback(() => {
    return isConnected && isAuthenticated && user?.isVerified
  }, [isConnected, isAuthenticated, user?.isVerified])

  const getWalletInfo = useCallback(() => {
    if (!address) return null

    return {
      address,
      chainId,
      isConnected,
      isAuthenticated,
      user,
    }
  }, [address, chainId, isConnected, isAuthenticated, user])

  return {
    // Wallet connection state
    isConnected,
    isAuthenticated: checkAuthentication(),
    isLoading: isLoading || isPending,
    address,
    chainId,
    user,
    error,
    
    // Wallet actions
    connectWallet,
    disconnectWallet,
    authenticate,
    signMessage,
    verifySignature,
    
    // Utility functions
    checkAuthentication,
    getWalletInfo,
  }
}
