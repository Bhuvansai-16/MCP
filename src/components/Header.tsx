import React from 'react';
import { motion } from 'framer-motion';
import { Github, Moon, Sun, Activity, Zap } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  activeTab: 'playground' | 'explore';
  onTabChange: (tab: 'playground' | 'explore') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isDark, 
  onToggleTheme, 
  activeTab, 
  onTabChange 
}) => {
  return (
    <motion.header 
      className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-500 ${
        isDark 
          ? 'bg-gray-900/80 border-gray-700/50' 
          : 'bg-white/80 border-gray-200/50'
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
            <div className={`relative p-3 rounded-2xl ${
              isDark 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                : 'bg-gradient-to-br from-blue-500 to-purple-500'
            } shadow-lg`}>
              <Activity className="w-8 h-8 text-white" />
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 opacity-0"
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
          
          {/* Navigation Tabs */}
          <div className={`flex items-center space-x-2 p-1 rounded-2xl ${
            isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
          } backdrop-blur-sm`}>
            {[
              { id: 'playground', label: 'Playground', icon: Zap },
              { id: 'explore', label: 'Explore MCPs', icon: Activity }
            ].map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                onClick={() => onTabChange(id as 'playground' | 'explore')}
                className={`relative flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === id
                    ? isDark
                      ? 'text-white shadow-lg'
                      : 'text-white shadow-lg'
                    : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {activeTab === id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </motion.button>
            ))}
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={onToggleTheme}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800/50 hover:bg-gray-700/50 text-yellow-400' 
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600'
              } backdrop-blur-sm`}
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            
            <motion.a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800/50 hover:bg-gray-700/50 text-white' 
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-700'
              } backdrop-blur-sm`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="w-5 h-5" />
              <span className="font-medium">GitHub</span>
            </motion.a>
          </div>
        </div>
      </div>
    </motion.header>
  );
};