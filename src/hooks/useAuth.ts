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

  return {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };
};