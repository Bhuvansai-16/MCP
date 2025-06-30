import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Moon, Sun, Activity, Zap, Search, BarChart3, Users, User, LogOut, Settings, Menu, X } from 'lucide-react';
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
      className="sticky top-0 z-50 py-3 transition-all duration-500 w-full"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full px-4">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="relative p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
              <motion.div
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 opacity-0"
                whileHover={{ opacity: 0.3 }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${
                isDark 
                  ? 'text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                MCP.playground
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Explore, benchmark & run LLM prompt strategies
              </p>
            </div>
          </motion.div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-gray-200/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showMobileMenu ? (
                <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              ) : (
                <Menu className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
              )}
            </motion.button>
          </div>
          
          {/* Navigation Tabs - Center - IMPROVED WITH CURVES (Desktop) */}
          <div className="hidden md:flex nav-container rounded-full backdrop-blur-md border border-gray-200/20 p-1 bg-white/5">
            {tabs.map(({ id, label, icon: Icon, description }) => (
              <motion.button
                key={id}
                onClick={() => onTabChange(id)}
                className={`nav-item ${activeTab === id ? 'nav-item-active' : ''} relative flex items-center space-x-1 px-3 py-2 font-medium transition-all duration-300 group ${
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
                <div className="relative z-10 flex items-center space-x-1">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">{label}</span>
                  <span className="sm:hidden text-sm">{label.split(' ')[0]}</span>
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Right Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            <motion.button
              onClick={onToggleTheme}
              className="btn-rounded p-2 rounded-lg bg-gray-100/30 dark:bg-gray-700/30"
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </motion.button>
            
            <motion.a
              href="https://github.com/modelcontextprotocol/servers"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-rounded flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-100/30 dark:bg-gray-700/30 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">GitHub</span>
            </motion.a>

            {/* User Authentication */}
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="btn-rounded flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100/30 dark:bg-gray-700/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full border-2 border-white/20"
                  />
                  <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
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
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.email}
                          </p>
                        </div>
                        
                        <button
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
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
                          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
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
                className="btn-gradient px-3 py-2 rounded-lg text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-4 h-4 mr-1" />
                <span>Sign In</span>
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="md:hidden mt-3 rounded-xl backdrop-blur-xl border overflow-hidden shadow-xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`p-3 ${isDark ? 'bg-gray-800/90 border-gray-700/50' : 'bg-white/90 border-white/50'}`}>
                {/* Mobile Navigation */}
                <div className="space-y-1 mb-3">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <motion.button
                      key={id}
                      onClick={() => {
                        onTabChange(id);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                        activeTab === id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          : isDark
                            ? 'text-gray-300 hover:bg-gray-700/50'
                            : 'text-gray-700 hover:bg-gray-100/50'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{label}</span>
                    </motion.button>
                  ))}
                </div>
                
                {/* Mobile Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/20">
                  <motion.button
                    onClick={onToggleTheme}
                    className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isDark ? <Sun className="w-4 h-4 text-yellow-400 mb-1" /> : <Moon className="w-4 h-4 text-gray-600 mb-1" />}
                    <span className="text-xs">{isDark ? 'Light' : 'Dark'}</span>
                  </motion.button>
                  
                  <motion.a
                    href="https://github.com/modelcontextprotocol/servers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Github className="w-4 h-4 mb-1" />
                    <span className="text-xs">GitHub</span>
                  </motion.a>
                  
                  {isAuthenticated ? (
                    <motion.button
                      onClick={() => {
                        logout();
                        setShowMobileMenu(false);
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <LogOut className="w-4 h-4 mb-1" />
                      <span className="text-xs">Logout</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => {
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <User className="w-4 h-4 mb-1" />
                      <span className="text-xs">Sign In</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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