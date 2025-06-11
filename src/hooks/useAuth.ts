import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

// Dynamic API base URL detection
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);
    
    if (hostname.includes('webcontainer-api.io')) {
      // Extract the WebContainer URL pattern and construct API URL
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const prefix = parts[0];
        const suffix = parts.slice(1).join('.');
        const apiUrl = `https://${prefix}--3001--${suffix}`;
        console.log('WebContainer API URL:', apiUrl);
        return apiUrl;
      }
    }
  }
  const fallbackUrl = 'http://localhost:3001';
  console.log('Using fallback API URL:', fallbackUrl);
  return fallbackUrl;
};

const API_BASE_URL = getApiBaseUrl();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: API Base URL:', API_BASE_URL);
    
    try {
      const token = localStorage.getItem('token');
      console.log('useAuth: Found token:', !!token);
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('useAuth: Token payload:', payload);
          
          if (payload.exp * 1000 > Date.now()) {
            console.log('useAuth: Token is valid, setting user');
            setUser({ id: payload.id, email: payload.email });
          } else {
            console.log('useAuth: Token expired, removing');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('useAuth: Invalid token format:', error);
          localStorage.removeItem('token');
        }
      } else {
        console.log('useAuth: No token found');
      }
    } catch (error) {
      console.error('useAuth: Error during initialization:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    console.log('useAuth: Login called with:', userData);
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    console.log('useAuth: Logout called');
    localStorage.removeItem('token');
    setUser(null);
  };

  return {
    user,
    login,
    logout,
    isLoading,
    API_BASE_URL
  };
};