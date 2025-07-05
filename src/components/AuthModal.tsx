import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Mail, Eye, EyeOff, Sparkles, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
  isDark: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess, isDark }) => {
  const { signIn, signUp, resetPassword, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!password) {
      setError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (!isLogin && !name.trim()) {
      setError('Name is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        console.log('🔐 Attempting login for:', email);
        const result = await signIn(email, password);
        
        if (result.success) {
          setSuccess('Successfully signed in!');
          setTimeout(() => {
            onAuthSuccess('auth-token', result.data?.user);
            onClose();
          }, 1000);
        } else {
          setError(result.error || 'Failed to sign in');
        }
      } else {
        console.log('🔐 Attempting signup for:', email);
        const result = await signUp(email, password, name);
        
        if (result.success) {
          setSuccess('Account created successfully!');
          setTimeout(() => {
            onAuthSuccess('auth-token', result.data?.user);
            onClose();
          }, 1000);
        } else {
          setError(result.error || 'Failed to create account');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccess('Password reset email sent! Check your inbox.');
        setTimeout(() => {
          setShowResetPassword(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  if (showResetPassword) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          className={`relative w-full max-w-md rounded-3xl backdrop-blur-xl border shadow-2xl ${
            isDark 
              ? 'bg-gray-800/90 border-gray-700/50' 
              : 'bg-white/90 border-white/50'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Lock className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Reset Password
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Enter your email to reset your password
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <motion.div
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center space-x-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-green-400 text-sm">{success}</p>
                </motion.div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-4 py-3 rounded-full border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm shadow-md`}
                  placeholder="Enter your email"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-4 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <span>Send Reset Email</span>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className={`text-sm font-medium transition-colors ${
                  isDark 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Back to sign in
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        className={`relative w-full max-w-md rounded-3xl backdrop-blur-xl border shadow-2xl ${
          isDark 
            ? 'bg-gray-800/90 border-gray-700/50' 
            : 'bg-white/90 border-white/50'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <motion.div
                className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <User className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isLogin ? 'Welcome Back' : 'Join MCP.playground'}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isLogin ? 'Sign in to your account' : 'Create your account'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center space-x-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-sm">{success}</p>
              </motion.div>
            )}

            {!isLogin && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className={`w-full px-4 py-3 rounded-full border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm shadow-md`}
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-full border-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm shadow-md`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 pr-12 rounded-full border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm shadow-md`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isLogin}
                  minLength={6}
                  className={`w-full px-4 py-3 rounded-full border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm shadow-md`}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className={`text-sm font-medium transition-colors ${
                    isDark 
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-4 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Please wait...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={switchMode}
              className={`text-sm font-medium transition-colors ${
                isDark 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};