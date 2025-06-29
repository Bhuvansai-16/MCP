import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      // The auth state change will be handled by the useAuth hook
      // Redirect to the main app after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Loader className="w-12 h-12 animate-spin text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Completing Authentication
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {user ? 'Welcome back! Redirecting...' : 'Processing your login...'}
        </p>
      </div>
    </div>
  );
};