import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Moon, Sun, Activity, Zap, Search, BarChart3, Users, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';

type TabType = 'compare' | 'playground' | 'explore' | 'community';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isDark, 
  onToggleTheme, 
  activeTab, 
  onTabChange 
}) => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabs = [
    { 
      id: 'compare' as TabType, 
      label: '🔍 Compare MCPs', 
      icon: BarChart3,
      description: 'Benchmark multiple protocols side-by-side'
    },
    { 
      id: 'playground' as TabType, 
      label: '🧪 Playground', 
      icon: Zap,
      description: 'Full-screen editor for testing MCPs'
    },
    { 
      id: 'explore' as TabType, 
      label: '🌎 Explore MCPs', 
      icon: Search,
      description: 'Discover open-source MCPs'
    },
    { 
      id: 'community' as TabType, 
      label: '👥 Community', 
      icon: Users,
      description: 'Share MCPs and connect with developers'
    }
  ];

  const handleAuthSuccess = (token: string, userData: any) => {
    login(token, userData);
    setShowAuthModal(false);
  };

  return (
    <motion.header 
      className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-500 ${
        isDark 
          ? 'border-gray-700/50' 
          : 'border-gray-200/50'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className={`relative p-3 rounded-full ${
              isDark 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                : 'bg-gradient-to-br from-blue-500 to-purple-500'
            } shadow-lg`}>
              <Activity className="w-8 h-8 text-white" />
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-0"
                whileHover={{ opacity: 0.3 }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${
                isDark 
                  ? 'text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                MCP.playground
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Explore, benchmark & run LLM prompt strategies
              </p>
            </div>
          </motion.div>
          
          {/* Navigation Tabs - Center - IMPROVED WITH CURVES */}
          <div className="nav-container">
            {tabs.map(({ id, label, icon: Icon, description }) => (
              <motion.button
                key={id}
                onClick={() => onTabChange(id)}
                className={`nav-item ${activeTab === id ? 'nav-item-active' : ''} relative flex items-center space-x-2 px-4 py-3 font-medium transition-all duration-300 group ${
                  activeTab === id
                    ? 'text-white shadow-lg'
                    : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Active tab background */}
                {activeTab === id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Tab content */}
                <div className="relative z-10 flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(' ')[0]}</span>
                </div>

                {/* Tooltip */}
                <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap ${
                  isDark ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
                } shadow-lg backdrop-blur-sm`}>
                  {description}
                  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 ${
                    isDark ? 'bg-gray-800 border-l border-t border-gray-600' : 'bg-white border-l border-t border-gray-200'
                  } rotate-45`} />
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={onToggleTheme}
              className="btn-rounded"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </motion.button>
            
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-rounded flex items-center space-x-2 px-4 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">GitHub</span>
            </motion.a>

            {/* User Authentication */}
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-rounded flex items-center space-x-3 px-4 py-3"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                  />
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      className={`absolute right-0 top-full mt-2 w-48 rounded-xl backdrop-blur-xl border shadow-2xl ${
                        isDark 
                          ? 'bg-gray-800/90 border-gray-700/50' 
                          : 'bg-white/90 border-white/50'
                      }`}
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-gray-200/20">
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.email}
                          </p>
                        </div>
                        
                        <button
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                            isDark 
                              ? 'text-gray-300 hover:bg-gray-700/50' 
                              : 'text-gray-700 hover:bg-gray-100/50'
                          }`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                            isDark 
                              ? 'text-red-400 hover:bg-red-500/10' 
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowAuthModal(true)}
                className="btn-gradient"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-5 h-5 mr-2" />
                <span>Sign In</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
};