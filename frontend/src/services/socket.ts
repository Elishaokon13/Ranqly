import { io, Socket } from 'socket.io-client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(() => {
    if (socket?.connected) return

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8000', {
      transports: ['websocket'],
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    setSocket(newSocket)
  }, [socket])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
      console.log('Socket disconnected manually')
    }
  }, [socket])

  useEffect(() => {
    if (!socket && !isConnected) {
      connect()
    }

    return () => {
      if (socket) {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('connect_error')
        socket.disconnect()
      }
    }
  }, [socket, isConnected, connect])

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  )
}
