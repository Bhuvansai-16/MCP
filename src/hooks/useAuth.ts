import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  verified: boolean;
  provider?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const userData = JSON.parse(atob(token));
          
          if (userData.exp > Date.now()) {
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              avatar: userData.avatar,
              verified: userData.verified,
              provider: userData.provider
            });
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.error('Invalid token format:', error);
          localStorage.removeItem('auth_token');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  // Social login handlers
  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would redirect to Google OAuth
      // For demo purposes, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = {
        id: `google-${Date.now()}`,
        email: 'user@gmail.com',
        name: 'Google User',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=google-${Date.now()}`,
        verified: true,
        provider: 'google'
      };

      const mockToken = btoa(JSON.stringify({
        ...mockUser,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }));

      localStorage.setItem('auth_token', mockToken);
      setUser(mockUser);
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Failed to login with Google' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGithub = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would redirect to GitHub OAuth
      // For demo purposes, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = {
        id: `github-${Date.now()}`,
        email: 'user@github.com',
        name: 'GitHub User',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=github-${Date.now()}`,
        verified: true,
        provider: 'github'
      };

      const mockToken = btoa(JSON.stringify({
        ...mockUser,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }));

      localStorage.setItem('auth_token', mockToken);
      setUser(mockUser);
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('GitHub login error:', error);
      return { success: false, error: 'Failed to login with GitHub' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    login,
    logout,
    loginWithGoogle,
    loginWithGithub,
    isLoading,
    isAuthenticated: !!user
  };
};