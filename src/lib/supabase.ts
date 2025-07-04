import { createClient } from '@supabase/supabase-js'

// For development, we'll use a mock implementation since Supabase credentials aren't configured
const isDevelopment = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('example')

// Mock Supabase client for development
const createMockClient = () => ({
  auth: {
    signUp: async ({ email, password, options }: any) => {
      // Simulate successful signup
      const mockUser = {
        id: `user_${Date.now()}`,
        email,
        user_metadata: options?.data || {},
        email_confirmed_at: new Date().toISOString(),
        app_metadata: { provider: 'email' }
      }
      
      return {
        data: {
          user: mockUser,
          session: {
            user: mockUser,
            access_token: 'mock_token',
            refresh_token: 'mock_refresh'
          }
        },
        error: null
      }
    },
    
    signInWithPassword: async ({ email, password }: any) => {
      // Simulate successful signin
      const mockUser = {
        id: `user_${Date.now()}`,
        email,
        user_metadata: { name: email.split('@')[0] },
        email_confirmed_at: new Date().toISOString(),
        app_metadata: { provider: 'email' }
      }
      
      return {
        data: {
          user: mockUser,
          session: {
            user: mockUser,
            access_token: 'mock_token',
            refresh_token: 'mock_refresh'
          }
        },
        error: null
      }
    },
    
    signOut: async () => {
      return { error: null }
    },
    
    resetPasswordForEmail: async (email: string) => {
      return { data: {}, error: null }
    },
    
    updateUser: async (updates: any) => {
      return { data: { user: updates }, error: null }
    },
    
    getUser: async () => {
      const savedUser = localStorage.getItem('mock_user')
      if (savedUser) {
        return { data: { user: JSON.parse(savedUser) }, error: null }
      }
      return { data: { user: null }, error: null }
    },
    
    getSession: async () => {
      const savedUser = localStorage.getItem('mock_user')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        return {
          data: {
            session: {
              user,
              access_token: 'mock_token',
              refresh_token: 'mock_refresh'
            }
          },
          error: null
        }
      }
      return { data: { session: null }, error: null }
    },
    
    onAuthStateChange: (callback: any) => {
      // Mock auth state change listener
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  }
})

// Create Supabase client or mock client
export const supabase = isDevelopment 
  ? createMockClient()
  : createClient(
      import.meta.env.VITE_SUPABASE_URL!, 
      import.meta.env.VITE_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    )

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
      
      // For mock client, save user to localStorage
      if (isDevelopment && data.user) {
        localStorage.setItem('mock_user', JSON.stringify(data.user))
      }
      
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
      
      // For mock client, save user to localStorage
      if (isDevelopment && data.user) {
        localStorage.setItem('mock_user', JSON.stringify(data.user))
      }
      
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      // For mock client, remove user from localStorage
      if (isDevelopment) {
        localStorage.removeItem('mock_user')
      }
      
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