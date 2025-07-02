import React from 'react';
import { motion } from 'framer-motion';
import { Github, Heart, Code, Globe, Twitter, ExternalLink } from 'lucide-react';

interface FooterProps {
  isDark: boolean;
  onCommunityClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ isDark, onCommunityClick }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <motion.footer 
      className={`w-full py-6 px-6 border-t transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-r from-gray-900/95 via-blue-900/95 to-purple-900/95 border-gray-800/50 text-gray-300' 
          : 'bg-gradient-to-r from-white/95 via-blue-50/95 to-purple-50/95 border-gray-200/50 text-gray-700'
      } backdrop-blur-xl relative overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)`
        }} />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          {/* Left Section - Copyright and Built with Love */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 text-center md:text-left">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                &copy; {currentYear} MCP.playground
              </span>
              <span className="hidden md:inline text-gray-500 dark:text-gray-600">—</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">Built with</span>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              </motion.div>
              <span className="text-sm">for the AI community</span>
            </div>
            
            {/* Built with Bolt.new Button */}
            <motion.a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500/90 hover:to-purple-500/90 text-white border border-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600/90 hover:to-purple-600/90 text-white border border-blue-400/30'
              } shadow-lg hover:shadow-xl backdrop-blur-sm`}
              whileHover={{ 
                scale: 1.05,
                boxShadow: isDark 
                  ? "0 8px 25px rgba(59, 130, 246, 0.3)" 
                  : "0 8px 25px rgba(59, 130, 246, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Code className="w-3 h-3" />
              <span>Built with Bolt.new</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </motion.a>
          </div>

          {/* Right Section - Quick Links */}
          <div className="flex items-center space-x-6">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Quick Links
            </span>
            
            <div className="flex items-center space-x-4">
              {/* Docs Link */}
              <motion.a
                href="https://modelcontextprotocol.io/docs"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-1 text-sm font-medium transition-all duration-300 ${
                  isDark 
                    ? 'text-gray-400 hover:text-blue-400' 
                    : 'text-gray-600 hover:text-blue-600'
                } hover:underline underline-offset-4`}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Globe className="w-4 h-4" />
                <span>Docs</span>
              </motion.a>

              {/* GitHub Link */}
              <motion.a
                href="https://github.com/Bhuvansai-16/MCP"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-1 text-sm font-medium transition-all duration-300 ${
                  isDark 
                    ? 'text-gray-400 hover:text-purple-400' 
                    : 'text-gray-600 hover:text-purple-600'
                } hover:underline underline-offset-4`}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </motion.a>

              {/* Community Link */}
              <motion.button
                onClick={onCommunityClick}
                className={`flex items-center space-x-1 text-sm font-medium transition-all duration-300 ${
                  isDark 
                    ? 'text-gray-400 hover:text-pink-400' 
                    : 'text-gray-600 hover:text-pink-600'
                } hover:underline underline-offset-4`}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Twitter className="w-4 h-4" />
                <span>Community</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Subtle divider line with gradient */}
        <motion.div 
          className={`mt-4 h-px bg-gradient-to-r ${
            isDark 
              ? 'from-transparent via-gray-700/50 to-transparent' 
              : 'from-transparent via-gray-300/50 to-transparent'
          }`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        />

        {/* Additional info row */}
        <motion.div 
          className="mt-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Empowering developers to build better AI applications with Model Context Protocol
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};