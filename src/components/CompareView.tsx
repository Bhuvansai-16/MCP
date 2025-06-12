import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Play, Plus, X, Clock, Zap, Target, CheckCircle, Settings, FileText } from 'lucide-react';
import { ProtocolResult } from '../App';

interface CompareViewProps {
  isDark: boolean;
}

interface ComparisonProtocol {
  id: string;
  name: string;
  description: string;
  color: string;
  selected: boolean;
  results?: ProtocolResult;
}

const availableProtocols: ComparisonProtocol[] = [
  {
    id: 'raw',
    name: 'Raw Prompting',
    description: 'Direct processing with full context',
    color: 'blue',
    selected: false
  },
  {
    id: 'chain',
    name: 'Sequential Chaining',
    description: 'Break into chunks, process sequentially',
    color: 'green',
    selected: false
  },
  {
    id: 'tree',
    name: 'Tree-of-Thought',
    description: 'Parallel branching with multiple perspectives',
    color: 'purple',
    selected: false
  },
  {
    id: 'rag',
    name: 'RAG + Summarization',
    description: 'Retrieval-augmented generation approach',
    color: 'orange',
    selected: false
  },
  {
    id: 'custom1',
    name: 'Custom MCP #1',
    description: 'Your custom implementation',
    color: 'pink',
    selected: false
  },
  {
    id: 'custom2',
    name: 'Custom MCP #2',
    description: 'Another custom implementation',
    color: 'cyan',
    selected: false
  }
];

export const CompareView: React.FC<CompareViewProps> = ({ isDark }) => {
  const [protocols, setProtocols] = useState<ComparisonProtocol[]>(availableProtocols);
  const [isRunning, setIsRunning] = useState(false);
  const [showProtocolSelector, setShowProtocolSelector] = useState(false);
  const [prompt, setPrompt] = useState('Analyze the key themes and provide actionable insights from this document.');
  const [document, setDocument] = useState(`# Sample Document for MCP Comparison

This document will be used to benchmark different Model Context Protocol implementations side-by-side.

## Key Features to Analyze
- Performance metrics (latency, tokens, quality)
- Response accuracy and completeness
- Resource efficiency
- Scalability considerations

## Test Scenarios
1. Simple question answering
2. Complex analysis tasks
3. Multi-step reasoning
4. Creative content generation

The comparison will help identify the most suitable protocol for different use cases.`);

  const selectedProtocols = protocols.filter(p => p.selected);

  const toggleProtocol = (id: string) => {
    setProtocols(prev => prev.map(p => 
      p.id === id ? { ...p, selected: !p.selected } : p
    ));
  };

  const runComparison = async () => {
    if (selectedProtocols.length === 0) return;

    setIsRunning(true);
    
    // Simulate running protocols
    for (let i = 0; i < selectedProtocols.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const protocol = selectedProtocols[i];
      const mockResult: ProtocolResult = {
        protocol: protocol.name,
        response: `Mock response from ${protocol.name}: This is a comprehensive analysis of the provided document using the ${protocol.name} approach. The results show detailed insights and actionable recommendations based on the content analysis.`,
        metrics: {
          tokens: Math.floor(Math.random() * 800) + 200,
          latency: Math.floor(Math.random() * 2000) + 300,
          quality: Math.floor(Math.random() * 3) + 7
        }
      };

      setProtocols(prev => prev.map(p => 
        p.id === protocol.id ? { ...p, results: mockResult } : p
      ));
    }

    setIsRunning(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="container mx-auto px-6 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className={`mb-8 p-8 rounded-3xl backdrop-blur-xl border ${
          isDark 
            ? 'bg-gray-800/30 border-gray-700/50' 
            : 'bg-white/30 border-white/50'
        } shadow-2xl`}
        variants={itemVariants}
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <BarChart3 className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className={`text-4xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Compare MCPs
            </h1>
          </div>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Visually select and benchmark multiple LLM protocols side-by-side
          </p>
        </div>

        {/* Quick Input */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <FileText className="w-4 h-4 inline mr-2" />
              Comparison Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your comparison prompt..."
              className={`w-full h-24 px-4 py-3 rounded-xl border-2 resize-none transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
            />
          </div>
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <FileText className="w-4 h-4 inline mr-2" />
              Test Document
            </label>
            <textarea
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="Enter your test document..."
              className={`w-full h-24 px-4 py-3 rounded-xl border-2 resize-none font-mono text-sm transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
            />
          </div>
        </div>
      </motion.div>

      {/* Protocol Selection */}
      <motion.div 
        className={`mb-8 p-6 rounded-3xl backdrop-blur-xl border ${
          isDark 
            ? 'bg-gray-800/30 border-gray-700/50' 
            : 'bg-white/30 border-white/50'
        } shadow-2xl`}
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Select Protocols to Compare
          </h2>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedProtocols.length} selected
            </span>
            <motion.button
              onClick={() => setShowProtocolSelector(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Protocol</span>
            </motion.button>
          </div>
        </div>

        {/* Selected Protocols Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedProtocols.map((protocol) => (
            <motion.div
              key={protocol.id}
              className={`p-4 rounded-2xl border-2 ${
                isDark 
                  ? `border-${protocol.color}-500/30 bg-${protocol.color}-500/10` 
                  : `border-${protocol.color}-200 bg-${protocol.color}-50/50`
              } backdrop-blur-sm`}
              whileHover={{ scale: 1.02 }}
              layout
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {protocol.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {protocol.description}
                  </p>
                </div>
                <button
                  onClick={() => toggleProtocol(protocol.id)}
                  className={`p-1 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-red-400' 
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {protocol.results && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Latency</span>
                    </span>
                    <span className="font-bold">{protocol.results.metrics.latency}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>Tokens</span>
                    </span>
                    <span className="font-bold">{protocol.results.metrics.tokens}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>Quality</span>
                    </span>
                    <span className="font-bold">{protocol.results.metrics.quality}/10</span>
                  </div>
                </div>
              )}

              {!protocol.results && !isRunning && (
                <div className={`text-center py-4 text-sm ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Ready to run
                </div>
              )}

              {isRunning && !protocol.results && (
                <div className="text-center py-4">
                  <motion.div
                    className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Running...
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          {selectedProtocols.length === 0 && (
            <div className={`col-span-full text-center py-12 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No protocols selected for comparison</p>
              <p className="text-sm mt-1">Click "Add Protocol" to get started</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Run Comparison */}
      {selectedProtocols.length > 0 && (
        <motion.div 
          className="text-center mb-8"
          variants={itemVariants}
        >
          <motion.button
            onClick={runComparison}
            disabled={isRunning || selectedProtocols.length === 0}
            className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 mx-auto ${
              !isRunning && selectedProtocols.length > 0
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-2xl hover:shadow-3xl'
                : isDark
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200/50 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={!isRunning && selectedProtocols.length > 0 ? { scale: 1.05 } : {}}
            whileTap={!isRunning && selectedProtocols.length > 0 ? { scale: 0.95 } : {}}
          >
            {isRunning ? (
              <>
                <motion.div
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Running Comparison...</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                <span>Run Comparison</span>
                <BarChart3 className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Results Comparison */}
      {selectedProtocols.some(p => p.results) && (
        <motion.div 
          className={`p-8 rounded-3xl backdrop-blur-xl border ${
            isDark 
              ? 'bg-gray-800/30 border-gray-700/50' 
              : 'bg-white/30 border-white/50'
          } shadow-2xl`}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Comparison Results
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedProtocols.filter(p => p.results).map((protocol) => (
              <motion.div
                key={protocol.id}
                className={`p-6 rounded-2xl border ${
                  isDark 
                    ? 'bg-gray-700/30 border-gray-600/30' 
                    : 'bg-white/30 border-gray-200/30'
                } backdrop-blur-sm`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-4 h-4 rounded-full bg-${protocol.color}-500`} />
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {protocol.name}
                  </h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>

                <div className={`p-4 rounded-xl mb-4 ${
                  isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {protocol.results?.response}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Latency
                    </p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {protocol.results?.metrics.latency}ms
                    </p>
                  </div>
                  <div>
                    <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tokens
                    </p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {protocol.results?.metrics.tokens}
                    </p>
                  </div>
                  <div>
                    <Target className="w-5 h-5 mx-auto mb-1 text-green-500" />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Quality
                    </p>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {protocol.results?.metrics.quality}/10
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Protocol Selector Modal */}
      <AnimatePresence>
        {showProtocolSelector && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowProtocolSelector(false)}
            />
            <motion.div
              className={`relative w-full max-w-2xl rounded-3xl backdrop-blur-xl border ${
                isDark 
                  ? 'bg-gray-800/90 border-gray-700/50' 
                  : 'bg-white/90 border-white/50'
              } shadow-2xl`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Add Protocol to Comparison
                  </h3>
                  <button
                    onClick={() => setShowProtocolSelector(false)}
                    className={`p-2 rounded-xl transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {protocols.filter(p => !p.selected).map((protocol) => (
                    <motion.button
                      key={protocol.id}
                      onClick={() => {
                        toggleProtocol(protocol.id);
                        setShowProtocolSelector(false);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                        isDark 
                          ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/40' 
                          : 'border-gray-200/30 bg-white/20 hover:bg-white/40'
                      } backdrop-blur-sm hover:shadow-lg`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-4 h-4 rounded-full bg-${protocol.color}-500`} />
                        <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {protocol.name}
                        </h4>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {protocol.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};