import React from 'react';
import { motion } from 'framer-motion';
import { Github, Heart, Code, Globe, Twitter } from 'lucide-react';

interface FooterProps {
  isDark: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDark }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <motion.footer 
      className={`w-full py-2 px-4 border-t transition-all duration-500 ${
        isDark 
          ? 'bg-gray-900/30 border-gray-800/50 text-gray-400' 
          : 'bg-white/30 border-gray-200/50 text-gray-600'
      } backdrop-blur-sm`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-1 md:mb-0">
            <p className="text-xs">
              &copy; {currentYear} MCP.playground
            </p>
            <div className="flex items-center space-x-1">
              <a 
                href="https://github.com/modelcontextprotocol/servers" 
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 hover:text-white' 
                    : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Github className="w-3 h-3" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 hover:text-white' 
                    : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Twitter className="w-3 h-3" />
              </a>
              <a 
                href="https://modelcontextprotocol.io" 
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 hover:text-white' 
                    : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Globe className="w-3 h-3" />
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className="text-xs">Made with</span>
            <Heart className="w-3 h-3 text-red-500" />
            <span className="text-xs">for the AI community</span>
            
            <motion.a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`ml-1 flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
              } shadow-sm hover:shadow-md`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Code className="w-3 h-3" />
              <span>Built with Bolt.new</span>
            </motion.a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};