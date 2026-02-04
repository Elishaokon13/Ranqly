import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface User {
  address: string
  chainId: number
  isVerified: boolean
  lastLogin: string
  profile?: {
    username?: string
    avatar?: string
    bio?: string
    socialLinks?: {
      twitter?: string
      github?: string
      discord?: string
    }
  }
  preferences?: {
    theme: 'light' | 'dark' | 'system'
    notifications: boolean
    emailUpdates: boolean
  }
  stats?: {
    totalVotes: number
    totalContests: number
    reputation: number
    achievements: string[]
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  lastActivity: string | null
  sessionExpiry: string | null
}

interface AuthActions {
  setUser: (user: User) => void
  setAuthenticated: (authenticated: boolean) => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
  updateProfile: (profile: Partial<User['profile']>) => void
  updatePreferences: (preferences: Partial<User['preferences']>) => void
  updateStats: (stats: Partial<User['stats']>) => void
  setLastActivity: (timestamp: string) => void
  setSessionExpiry: (timestamp: string) => void
  clearAuth: () => void
  checkSession: () => boolean
  refreshSession: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  lastActivity: null,
  sessionExpiry: null,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setUser: (user: User) => {
        set((state) => {
          state.user = user
          state.isAuthenticated = true
          state.lastActivity = new Date().toISOString()
          state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
      },

      setAuthenticated: (authenticated: boolean) => {
        set((state) => {
          state.isAuthenticated = authenticated
          if (authenticated) {
            state.lastActivity = new Date().toISOString()
            state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        })
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => {
          if (state.user) {
            state.user = { ...state.user, ...updates }
            state.lastActivity = new Date().toISOString()
          }
        })
      },

      updateProfile: (profile: Partial<User['profile']>) => {
        set((state) => {
          if (state.user) {
            state.user.profile = { ...state.user.profile, ...profile }
            state.lastActivity = new Date().toISOString()
          }
        })
      },

      updatePreferences: (preferences: Partial<User['preferences']>) => {
        set((state) => {
          if (state.user) {
            state.user.preferences = { ...state.user.preferences, ...preferences }
            state.lastActivity = new Date().toISOString()
          }
        })
      },

      updateStats: (stats: Partial<User['stats']>) => {
        set((state) => {
          if (state.user) {
            state.user.stats = { ...state.user.stats, ...stats }
            state.lastActivity = new Date().toISOString()
          }
        })
      },

      setLastActivity: (timestamp: string) => {
        set((state) => {
          state.lastActivity = timestamp
        })
      },

      setSessionExpiry: (timestamp: string) => {
        set((state) => {
          state.sessionExpiry = timestamp
        })
      },

      clearAuth: () => {
        set((state) => {
          state.user = null
          state.isAuthenticated = false
          state.isLoading = false
          state.lastActivity = null
          state.sessionExpiry = null
        })
      },

      checkSession: () => {
        const state = get()
        if (!state.sessionExpiry || !state.isAuthenticated) {
          return false
        }

        const now = new Date()
        const expiry = new Date(state.sessionExpiry)
        
        if (now > expiry) {
          set((state) => {
            state.isAuthenticated = false
            state.sessionExpiry = null
          })
          return false
        }

        return true
      },

      refreshSession: () => {
        set((state) => {
          if (state.isAuthenticated) {
            state.lastActivity = new Date().toISOString()
            state.sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        })
      },
    })),
    {
      name: 'ranqly-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
        sessionExpiry: state.sessionExpiry,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Check if session is still valid on rehydration
          const isValid = state.checkSession()
          if (!isValid) {
            state.clearAuth()
          }
        }
      },
    }
  )
)

// Session management utilities
export const sessionManager = {
  checkSession: () => {
    const store = useAuthStore.getState()
    return store.checkSession()
  },

  refreshSession: () => {
    const store = useAuthStore.getState()
    store.refreshSession()
  },

  clearSession: () => {
    const store = useAuthStore.getState()
    store.clearAuth()
  },

  getSessionInfo: () => {
    const store = useAuthStore.getState()
    return {
      isAuthenticated: store.isAuthenticated,
      user: store.user,
      lastActivity: store.lastActivity,
      sessionExpiry: store.sessionExpiry,
    }
  },
}

// Auto-refresh session every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useAuthStore.getState()
    if (store.isAuthenticated) {
      store.refreshSession()
    }
  }, 5 * 60 * 1000) // 5 minutes
}
