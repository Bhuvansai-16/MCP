import { createClient } from '@supabase/supabase-js'

// Check if we have valid Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// For development without Supabase, we'll use a mock implementation
const isDevelopment = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')

// Mock user storage for development
const MOCK_USERS_KEY = 'mcp_mock_users'
const MOCK_SESSION_KEY = 'mcp_mock_session'

// Mock Supabase client for development
const createMockClient = () => {
  const getMockUsers = () => {
    const users = localStorage.getItem(MOCK_USERS_KEY)
    return users ? JSON.parse(users) : []
  }

  const saveMockUsers = (users: any[]) => {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
  }

  const getMockSession = () => {
    const session = localStorage.getItem(MOCK_SESSION_KEY)
    return session ? JSON.parse(session) : null
  }

  const saveMockSession = (session: any) => {
    if (session) {
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(MOCK_SESSION_KEY)
    }
  }

  const createMockUser = (email: string, password: string, metadata: any = {}) => {
    return {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      password, // In real app, this would be hashed
      user_metadata: {
        name: metadata.name || email.split('@')[0],
        ...metadata
      },
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: 'email' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const createMockSession = (user: any) => {
    return {
      user,
      access_token: `mock_token_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      token_type: 'bearer'
    }
  }

  return {
    auth: {
      signUp: async ({ email, password, options }: any) => {
        try {
          console.log('🔐 Mock signup attempt:', email)
          
          // Validate input
          if (!email || !password) {
            throw new Error('Email and password are required')
          }

          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long')
          }

          if (!/\S+@\S+\.\S+/.test(email)) {
            throw new Error('Please enter a valid email address')
          }

          const users = getMockUsers()
          
          // Check if user already exists
          const existingUser = users.find((u: any) => u.email === email)
          if (existingUser) {
            throw new Error('User already registered')
          }

          // Create new user
          const newUser = createMockUser(email, password, options?.data)
          users.push(newUser)
          saveMockUsers(users)

          // Create session
          const session = createMockSession(newUser)
          saveMockSession(session)

          console.log('✅ Mock signup successful:', email)
          
          return {
            data: {
              user: newUser,
              session
            },
            error: null
          }
        } catch (error: any) {
          console.error('❌ Mock signup error:', error.message)
          return {
            data: null,
            error: { message: error.message }
          }
        }
      },
      
      signInWithPassword: async ({ email, password }: any) => {
        try {
          console.log('🔐 Mock signin attempt:', email)
          
          if (!email || !password) {
            throw new Error('Email and password are required')
          }

          const users = getMockUsers()
          const user = users.find((u: any) => u.email === email && u.password === password)
          
          if (!user) {
            throw new Error('Invalid email or password')
          }

          // Create session
          const session = createMockSession(user)
          saveMockSession(session)

          console.log('✅ Mock signin successful:', email)
          
          return {
            data: {
              user,
              session
            },
            error: null
          }
        } catch (error: any) {
          console.error('❌ Mock signin error:', error.message)
          return {
            data: null,
            error: { message: error.message }
          }
        }
      },
      
      signOut: async () => {
        try {
          saveMockSession(null)
          console.log('✅ Mock signout successful')
          return { error: null }
        } catch (error: any) {
          return { error: { message: error.message } }
        }
      },
      
      resetPasswordForEmail: async (email: string) => {
        try {
          console.log('📧 Mock password reset for:', email)
          // In a real app, this would send an email
          return { data: {}, error: null }
        } catch (error: any) {
          return { data: null, error: { message: error.message } }
        }
      },
      
      updateUser: async (updates: any) => {
        try {
          const session = getMockSession()
          if (!session) {
            throw new Error('No active session')
          }

          const users = getMockUsers()
          const userIndex = users.findIndex((u: any) => u.id === session.user.id)
          
          if (userIndex === -1) {
            throw new Error('User not found')
          }

          // Update user
          users[userIndex] = { ...users[userIndex], ...updates, updated_at: new Date().toISOString() }
          saveMockUsers(users)

          // Update session
          const updatedSession = { ...session, user: users[userIndex] }
          saveMockSession(updatedSession)

          return { data: { user: users[userIndex] }, error: null }
        } catch (error: any) {
          return { data: null, error: { message: error.message } }
        }
      },
      
      getUser: async () => {
        try {
          const session = getMockSession()
          return {
            data: { user: session?.user || null },
            error: null
          }
        } catch (error: any) {
          return { data: { user: null }, error: { message: error.message } }
        }
      },
      
      getSession: async () => {
        try {
          const session = getMockSession()
          
          // Check if session is expired
          if (session && session.expires_at < Date.now()) {
            saveMockSession(null)
            return { data: { session: null }, error: null }
          }
          
          return {
            data: { session },
            error: null
          }
        } catch (error: any) {
          return { data: { session: null }, error: { message: error.message } }
        }
      },
      
      onAuthStateChange: (callback: any) => {
        // Mock auth state change listener
        let currentSession = getMockSession()
        
        // Check session periodically
        const interval = setInterval(() => {
          const newSession = getMockSession()
          if (JSON.stringify(currentSession) !== JSON.stringify(newSession)) {
            currentSession = newSession
            callback(newSession ? 'SIGNED_IN' : 'SIGNED_OUT', newSession)
          }
        }, 1000)

        return {
          data: {
            subscription: {
              unsubscribe: () => {
                clearInterval(interval)
              }
            }
          }
        }
      }
    }
  }
}

// Create Supabase client or mock client
export const supabase = isDevelopment 
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })

// Auth helper functions
export const authHelpers = {
  signUp: async (email: string, password: string, metadata?: { name?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err: any) {
      return { error: { message: err.message } }
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  updatePassword: async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      })
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

console.log('🔧 Supabase client initialized:', isDevelopment ? 'Mock Mode' : 'Production Mode')