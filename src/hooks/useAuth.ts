import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

// Dynamic API base URL detection
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('webcontainer-api.io')) {
      // Extract the WebContainer URL pattern and construct API URL
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const prefix = parts[0];
        const suffix = parts.slice(1).join('.');
        return `https://${prefix}--3001--${suffix}`;
      }
    }
  }
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('API Base URL:', API_BASE_URL);
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ id: payload.id, email: payload.email });
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
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