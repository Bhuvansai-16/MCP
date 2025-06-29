import React from 'react';
import { motion } from 'framer-motion';
import { Github, Heart, Code, Mail, Globe, Twitter, Linkedin, BookOpen } from 'lucide-react';

interface FooterProps {
  isDark: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isDark }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <motion.footer 
      className={`w-full py-8 px-6 mt-8 border-t transition-all duration-500 ${
        isDark 
          ? 'bg-gray-900/30 border-gray-800/50 text-gray-400' 
          : 'bg-white/30 border-gray-200/50 text-gray-600'
      } backdrop-blur-sm`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              MCP.playground
            </h3>
            <p className="text-sm mb-4">
              Explore, benchmark & run LLM prompt strategies with the Model Context Protocol Playground.
            </p>
            <div className="flex items-center space-x-2">
              <motion.a
                href="https://github.com/Bhuvansai-16/MCP.git"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 hover:text-white' 
                    : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Github className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 hover:text-white' 
                    : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-800 hover:text-white' 
                    : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Linkedin className="w-5 h-5" />
              </motion.a>
            </div>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://modelcontextprotocol.io" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>MCP Documentation</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/modelcontextprotocol/servers" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline flex items-center space-x-2"
                >
                  <Code className="w-4 h-4" />
                  <span>MCP Servers</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/modelcontextprotocol/examples" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline flex items-center space-x-2"
                >
                  <Github className="w-4 h-4" />
                  <span>Example MCPs</span>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Community */}
          <div>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Community
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://discord.gg" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline flex items-center space-x-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>Discord Server</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline flex items-center space-x-2"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter Community</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/Bhuvansai-16/MCP.git" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline flex items-center space-x-2"
                >
                  <Github className="w-4 h-4" />
                  <span>Contribute on GitHub</span>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:contact@mcpplayground.com" 
                  className="text-sm hover:underline flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>contact@mcpplayground.com</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/messages" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline flex items-center space-x-2"
                >
                  <Twitter className="w-4 h-4" />
                  <span>DM on Twitter</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">
            &copy; {currentYear} MCP.playground. All rights reserved.
          </p>
          <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm">for the AI community</span>
            </div>
            
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-blue-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-blue-600'
              }`}
            >
              <span className="font-medium">Built with Bolt.new</span>
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};