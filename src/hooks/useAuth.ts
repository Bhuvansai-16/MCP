import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, authHelpers } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  verified: boolean;
  provider?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session && mounted) {
          setSession(session);
          setUser(transformSupabaseUser(session.user));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          setUser(transformSupabaseUser(session.user));
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const transformSupabaseUser = (supabaseUser: User): AuthUser => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      avatar: supabaseUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.email}`,
      verified: supabaseUser.email_confirmed_at !== null,
      provider: supabaseUser.app_metadata?.provider || 'email'
    };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('🔐 Attempting signup for:', email);

      const { data, error } = await authHelpers.signUp(email, password, { name });
      
      if (error) {
        console.error('Signup error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Signup successful:', data);

      // The auth state change listener will handle setting the user
      return { success: true, data };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('🔐 Attempting signin for:', email);

      const { data, error } = await authHelpers.signIn(email, password);
      
      if (error) {
        console.error('Signin error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Signin successful:', data);

      // The auth state change listener will handle setting the user
      return { success: true, data };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log('🔐 Attempting signout');
      
      const { error } = await authHelpers.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Signout successful');
      
      // The auth state change listener will handle clearing the user
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('📧 Attempting password reset for:', email);

      const { error } = await authHelpers.resetPassword(email);
      
      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Password reset email sent');
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  // Legacy methods for backward compatibility
  const login = (token: string, userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    return await signOut();
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    // Legacy methods
    login,
    logout
  };
};