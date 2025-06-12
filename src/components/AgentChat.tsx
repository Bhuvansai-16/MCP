import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Send, Bot, User, Settings, Eye, EyeOff, Zap, Clock, Target } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
}

interface AgentChatProps {
  isDark: boolean;
  messages: ChatMessage[];
  isAgentRunning: boolean;
  isValidMCP: boolean;
  mcpSchema: any;
  onStartAgent: () => void;
  onStopAgent: () => void;
  onUserMessage: (message: string) => void;
  onToggleExecution: () => void;
  showExecutionPanel: boolean;
}

export const AgentChat: React.FC<AgentChatProps> = ({
  isDark,
  messages,
  isAgentRunning,
  isValidMCP,
  mcpSchema,
  onStartAgent,
  onStopAgent,
  onUserMessage,
  onToggleExecution,
  showExecutionPanel
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Only scroll when new messages are added, not on every render
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      const scrollContainer = messagesContainerRef.current;
      if (scrollContainer) {
        const isScrolledToBottom = scrollContainer.scrollHeight - scrollContainer.clientHeight <= scrollContainer.scrollTop + 1;
        
        // Only auto-scroll if user is already at the bottom
        if (isScrolledToBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }
  }, [messages.length]); // Only depend on message count, not the messages array itself

  // Focus input when agent starts, but don't scroll
  useEffect(() => {
    if (isAgentRunning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAgentRunning]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isAgentRunning) return;

    onUserMessage(inputMessage.trim());
    setInputMessage('');
    
    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-5 h-5" />;
      case 'agent':
        return <Bot className="w-5 h-5" />;
      case 'system':
        return <Settings className="w-5 h-5" />;
      default:
        return <Bot className="w-5 h-5" />;
    }
  };

  const getMessageColors = (type: string) => {
    switch (type) {
      case 'user':
        return isDark 
          ? 'bg-blue-500/20 border-blue-500/30 text-blue-100' 
          : 'bg-blue-50 border-blue-200 text-blue-900';
      case 'agent':
        return isDark 
          ? 'bg-purple-500/20 border-purple-500/30 text-purple-100' 
          : 'bg-purple-50 border-purple-200 text-purple-900';
      case 'system':
        return isDark 
          ? 'bg-gray-500/20 border-gray-500/30 text-gray-300' 
          : 'bg-gray-50 border-gray-200 text-gray-700';
      default:
        return isDark 
          ? 'bg-gray-500/20 border-gray-500/30 text-gray-300' 
          : 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const exampleQueries = [
    "What's the weather like in San Francisco?",
    "Search for the latest news about AI",
    "Create a calendar event for tomorrow",
    "Help me find products under $50"
  ];

  return (
    <div className={`h-full rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
      isDark 
        ? 'bg-gray-800/30 border-gray-700/50' 
        : 'bg-white/30 border-white/50'
    } shadow-2xl flex flex-col overflow-hidden`}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              className={`p-2 rounded-xl ${
                isAgentRunning 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-br from-gray-500 to-gray-600'
              }`}
              animate={isAgentRunning ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bot className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Agent Chat
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isAgentRunning 
                  ? `Active with ${mcpSchema?.name || 'MCP'}` 
                  : 'Agent stopped'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Execution Panel Toggle */}
            <motion.button
              onClick={onToggleExecution}
              className={`p-2 rounded-xl transition-all duration-300 ${
                showExecutionPanel
                  ? isDark 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                  : isDark 
                    ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 border border-gray-600/50' 
                    : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
              } backdrop-blur-sm`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showExecutionPanel ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </motion.button>

            {/* Start/Stop Agent Button */}
            <motion.button
              onClick={isAgentRunning ? onStopAgent : onStartAgent}
              disabled={!isValidMCP}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                !isValidMCP
                  ? isDark
                    ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/50'
                    : 'bg-gray-200/50 text-gray-500 cursor-not-allowed border border-gray-300/50'
                  : isAgentRunning
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
              } backdrop-blur-sm`}
              whileHover={isValidMCP ? { scale: 1.05 } : {}}
              whileTap={isValidMCP ? { scale: 0.95 } : {}}
            >
              {isAgentRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Stop Agent</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Agent</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* MCP Status */}
        {mcpSchema && (
          <div className={`p-3 rounded-xl ${
            isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50/50 border border-blue-200/50'
          }`}>
            <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              <strong>Available Tools:</strong> {mcpSchema.tools.map((t: any) => t.name).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Messages - Scrollable */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 p-6 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <motion.div
              className={`p-8 rounded-2xl ${
                isDark ? 'bg-gray-700/30' : 'bg-gray-100/30'
              } backdrop-blur-sm`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Bot className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {isAgentRunning ? 'Agent Ready' : 'Start the Agent'}
              </h3>
              <p className={`text-sm mb-6 ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {isAgentRunning 
                  ? 'Ask me anything using the available MCP tools!'
                  : 'Load a valid MCP schema and start the agent to begin chatting.'
                }
              </p>

              {isAgentRunning && (
                <div>
                  <p className={`text-sm font-medium mb-3 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Try these example queries:
                  </p>
                  <div className="space-y-2">
                    {exampleQueries.map((query, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setInputMessage(query)}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-600/30 hover:bg-gray-600/50 text-gray-300' 
                            : 'bg-white/50 hover:bg-white/70 text-gray-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        "{query}"
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`p-2 rounded-xl ${
                    message.type === 'user' 
                      ? 'bg-blue-500/20' 
                      : message.type === 'agent'
                        ? 'bg-purple-500/20'
                        : 'bg-gray-500/20'
                  }`}>
                    {getMessageIcon(message.type)}
                  </div>
                  
                  <div className={`flex-1 max-w-[80%] ${
                    message.type === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`p-4 rounded-2xl border backdrop-blur-sm ${getMessageColors(message.type)}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      
                      {/* Tool Calls */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.toolCalls.map((call, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-xl ${
                                isDark ? 'bg-gray-800/50' : 'bg-white/50'
                              } border border-gray-200/20`}
                            >
                              <div className="flex items-center space-x-2 mb-2">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span className="text-xs font-medium">Tool: {call.tool}</span>
                              </div>
                              <div className="text-xs space-y-1">
                                <div>
                                  <span className="font-medium">Input:</span> {JSON.stringify(call.input)}
                                </div>
                                <div>
                                  <span className="font-medium">Output:</span> {JSON.stringify(call.output)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-xs mt-1 ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    } ${message.type === 'user' ? 'text-right' : ''}`}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                className="flex items-start space-x-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div className={`p-4 rounded-2xl border backdrop-blur-sm ${
                  isDark 
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-100' 
                    : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}>
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-2 h-2 bg-current rounded-full"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-current rounded-full"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-current rounded-full"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input - Fixed */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200/20">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isAgentRunning 
                ? "Ask me anything using the available MCP tools..." 
                : "Start the agent to begin chatting..."
            }
            disabled={!isAgentRunning}
            className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
              isDark 
                ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isAgentRunning}
            className={`p-3 rounded-xl transition-all duration-300 ${
              inputMessage.trim() && isAgentRunning
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg'
                : isDark
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200/50 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={inputMessage.trim() && isAgentRunning ? { scale: 1.05 } : {}}
            whileTap={inputMessage.trim() && isAgentRunning ? { scale: 0.95 } : {}}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};