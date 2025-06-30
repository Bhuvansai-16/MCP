import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Send, Bot, User, Settings, Eye, EyeOff, Zap, Clock, Target, Sparkles } from 'lucide-react';

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
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added - ONLY scroll the chat container
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      // Use scrollIntoView with the chat container as the scrolling context
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [messages]);

  // Focus input when agent starts
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

  const handleSuggestedPrompt = (prompt: string) => {
    setInputMessage(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
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

  // Enhanced suggested prompts based on MCP tools
  const getSuggestedPrompts = () => {
    if (!mcpSchema || !mcpSchema.tools) {
      return [
        "What can you help me with?",
        "Show me what tools are available",
        "How do I use this MCP?",
        "Give me an example of what you can do"
      ];
    }

    const prompts = [];
    
    // Generate prompts based on available tools
    mcpSchema.tools.forEach((tool: any) => {
      const toolName = tool.name.toLowerCase();
      
      if (toolName.includes('weather')) {
        prompts.push("What's the weather like in San Francisco?");
        prompts.push("Show me the forecast for next week in Tokyo");
      } else if (toolName.includes('search')) {
        prompts.push("Search for the latest news about AI");
        prompts.push("Find information about machine learning");
      } else if (toolName.includes('calendar') || toolName.includes('event')) {
        prompts.push("Create a calendar event for tomorrow");
        prompts.push("Show me my upcoming meetings");
      } else if (toolName.includes('product') || toolName.includes('shop')) {
        prompts.push("Help me find products under $50");
        prompts.push("Search for electronics on sale");
      } else if (toolName.includes('travel') || toolName.includes('flight')) {
        prompts.push("Find flights from NYC to London");
        prompts.push("Plan a trip to Paris for next month");
      } else if (toolName.includes('finance') || toolName.includes('budget')) {
        prompts.push("Show me my spending analysis");
        prompts.push("Create a budget for this month");
      } else if (toolName.includes('social') || toolName.includes('post')) {
        prompts.push("Schedule a social media post");
        prompts.push("Get my social media analytics");
      } else {
        // Generic prompts for unknown tools
        prompts.push(`Use the ${tool.name} tool`);
        prompts.push(`Help me with ${tool.description.toLowerCase()}`);
      }
    });

    // Add some generic helpful prompts
    prompts.push("What tools do you have available?");
    prompts.push("Show me an example of what you can do");
    
    // Return unique prompts, limited to 6
    return [...new Set(prompts)].slice(0, 6);
  };

  const suggestedPrompts = getSuggestedPrompts();

  return (
    <div className="h-full flex flex-col rounded-3xl backdrop-blur-xl border transition-all duration-500 bg-white/30 dark:bg-gray-800/30 border-white/50 dark:border-gray-700/50 shadow-2xl overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200/20">
        <div className="flex items-center justify-between mb-2">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Agent Chat
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/50 dark:bg-blue-500/10 dark:border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Available Tools:</strong> {mcpSchema.tools.map((t: any) => t.name).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Messages Container - Scrollable with fixed height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div 
          ref={chatContainerRef}
          className="h-full p-6 overflow-y-auto scrollable-container"
          style={{ maxHeight: '100%' }}
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

                {isAgentRunning && suggestedPrompts.length > 0 && (
                  <div>
                    <p className={`text-sm font-medium mb-3 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      Try these suggestions:
                    </p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {suggestedPrompts.map((prompt, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleSuggestedPrompt(prompt)}
                          className={`text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                            isDark 
                              ? 'bg-gray-600/30 hover:bg-gray-600/50 text-gray-300 border border-gray-600/30 hover:border-gray-500/50' 
                              : 'bg-white/50 hover:bg-white/70 text-gray-700 border border-gray-200/50 hover:border-gray-300/50'
                          } backdrop-blur-sm`}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center space-x-2">
                            <Zap className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            <span>"{prompt}"</span>
                          </div>
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
      </div>

      {/* Input Section - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200/20">
        {/* Suggested Prompts for Active Agent */}
        {isAgentRunning && messages.length > 0 && suggestedPrompts.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                      : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                  } backdrop-blur-sm`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
                </motion.button>
              ))}
            </div>
          </div>
        )}

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