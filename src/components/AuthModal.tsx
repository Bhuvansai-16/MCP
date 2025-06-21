import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Mail, Github, Chrome, Eye, EyeOff, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
  isDark: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthSuccess, isDark }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = {
        id: Date.now().toString(),
        email,
        name: name || email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        verified: true
      };

      const mockToken = btoa(JSON.stringify({
        ...mockUser,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }));

      localStorage.setItem('auth_token', mockToken);
      onAuthSuccess(mockToken, mockUser);
      
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setLoading(true);
    setError('');

    try {
      // Simulate social login
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUser = {
        id: Date.now().toString(),
        email: `user@${provider}.com`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
        verified: true,
        provider
      };

      const mockToken = btoa(JSON.stringify({
        ...mockUser,
        exp: Date.now() + 24 * 60 * 60 * 1000
      }));

      localStorage.setItem('auth_token', mockToken);
      onAuthSuccess(mockToken, mockUser);
      
    } catch (err) {
      setError(`${provider} authentication failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

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
                className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500"
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
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <motion.button
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                isDark 
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50 hover:bg-gray-700/70 text-white' 
                  : 'border-gray-200 hover:border-gray-300 bg-white/50 hover:bg-white/70 text-gray-900'
              } backdrop-blur-sm disabled:opacity-50`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Github className="w-5 h-5" />
              <span className="font-medium">Continue with GitHub</span>
            </motion.button>

            <motion.button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                isDark 
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50 hover:bg-gray-700/70 text-white' 
                  : 'border-gray-200 hover:border-gray-300 bg-white/50 hover:bg-white/70 text-gray-900'
              } backdrop-blur-sm disabled:opacity-50`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Chrome className="w-5 h-5" />
              <span className="font-medium">Continue with Google</span>
            </motion.button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className={`absolute inset-0 flex items-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              <div className="w-full border-t border-current opacity-30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-3 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-red-400 text-sm">{error}</p>
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
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
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
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
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
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
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
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
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
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
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