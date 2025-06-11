import React, { useState } from 'react';
import { X, User, Lock, Mail } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
}

// Dynamic API base URL detection
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('webcontainer-api.io')) {
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

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('test@example.com'); // Default for testing
  const [password, setPassword] = useState('password123'); // Default for testing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const url = `${API_BASE_URL}${endpoint}`;
      
      console.log('AuthModal: Making request to:', url);
      console.log('AuthModal: Request data:', { email, password: '***' });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('AuthModal: Response status:', response.status);

      const data = await response.json();
      console.log('AuthModal: Response data:', data);

      if (!response.ok) {
        throw new Error(data.error?.message || `Authentication failed: ${response.status}`);
      }

      localStorage.setItem('token', data.token);
      onAuthSuccess(data.token, data.user);
      
      // Show success toast
      if ((window as any).showToast) {
        (window as any).showToast({ 
          type: 'success', 
          message: isLogin ? 'Successfully logged in!' : 'Account created successfully!' 
        });
      }
    } catch (err) {
      console.error('AuthModal: Auth error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-sm">
              <strong>Demo credentials:</strong><br />
              Email: test@example.com<br />
              Password: password123
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};