import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Copy, Check, LayoutGrid, Clock, Zap, Target, Eye, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { ProtocolResult } from '../App';

interface ResultsSectionProps {
  results: ProtocolResult[];
  isDark: boolean;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ results, isDark }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sideByView, setSideByView] = useState(false);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success('Response copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const getProtocolColor = (protocol: string) => {
    const colors = {
      raw: 'blue',
      chain: 'green',
      tree: 'purple',
      rag: 'orange'
    };
    return colors[protocol as keyof typeof colors] || 'blue';
  };

  const getProtocolGradient = (protocol: string) => {
    const gradients = {
      raw: 'from-blue-500 to-blue-600',
      chain: 'from-green-500 to-green-600',
      tree: 'from-purple-500 to-purple-600',
      rag: 'from-orange-500 to-orange-600'
    };
    return gradients[protocol as keyof typeof gradients] || 'from-blue-500 to-blue-600';
  };

  if (sideByView) {
    return (
      <motion.div 
        className={`rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
          isDark 
            ? 'bg-gray-800/30 border-gray-700/50' 
            : 'bg-white/30 border-white/50'
        } shadow-2xl`}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <motion.div
                className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <LayoutGrid className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Side-by-Side Comparison
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Compare protocol results simultaneously
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => setSideByView(false)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
              } backdrop-blur-sm`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-4 h-4" />
              <span>Tab View</span>
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((result, index) => {
              const gradient = getProtocolGradient(result.protocol);
              return (
                <motion.div 
                  key={index} 
                  className={`rounded-2xl border-2 overflow-hidden ${
                    isDark 
                      ? 'border-gray-600/30 bg-gray-700/20' 
                      : 'border-gray-200/30 bg-white/20'
                  } backdrop-blur-sm`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className={`bg-gradient-to-r ${gradient} p-4`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white capitalize text-lg">
                        {result.protocol}
                      </h3>
                      <motion.button
                        onClick={() => copyToClipboard(result.response, index)}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all duration-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className={`rounded-xl p-4 mb-4 ${
                      isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'
                    } backdrop-blur-sm`}>
                      <p className={`text-sm leading-relaxed ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {result.response}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
                        <Clock className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                          Latency
                        </p>
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {result.metrics.latency}ms
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
                        <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                          Tokens
                        </p>
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {result.metrics.tokens}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
                        <Target className="w-4 h-4 mx-auto mb-1 text-green-500" />
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                          Quality
                        </p>
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {result.metrics.quality}/10
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
        isDark 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-white/30 border-white/50'
      } shadow-2xl`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Protocol Results
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Detailed analysis results from each protocol
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => setSideByView(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              isDark 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Side-by-Side Compare</span>
          </motion.button>
        </div>

        <Tabs className={`react-tabs ${isDark ? 'dark' : ''}`}>
          <TabList className={`flex space-x-2 p-2 rounded-2xl ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
          } backdrop-blur-sm mb-8`}>
            {results.map((result, index) => {
              const gradient = getProtocolGradient(result.protocol);
              return (
                <Tab
                  key={index}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
                    isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-600/50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  selectedClassName={`bg-gradient-to-r ${gradient} text-white shadow-lg transform scale-105`}
                >
                  <span className="capitalize font-bold">{result.protocol}</span>
                </Tab>
              );
            })}
          </TabList>

          {results.map((result, index) => (
            <TabPanel key={index}>
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold capitalize ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {result.protocol} Response
                    </h3>
                    <motion.button
                      onClick={() => copyToClipboard(result.response, index)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                        copiedIndex === index
                          ? 'bg-green-500 text-white'
                          : isDark
                            ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
                            : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                      } backdrop-blur-sm`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                  
                  <div className={`rounded-2xl p-6 border-2 max-h-96 overflow-y-auto ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600/50' 
                      : 'bg-gray-50/50 border-gray-200/50'
                  } backdrop-blur-sm`}>
                    <p className={`leading-relaxed ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {result.response}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className={`text-xl font-bold mb-6 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Metrics
                  </h3>
                  
                  <div className="space-y-6">
                    <motion.div 
                      className={`p-6 rounded-2xl ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                      } backdrop-blur-sm`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Clock className="w-6 h-6 text-blue-500" />
                        <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Latency
                        </span>
                      </div>
                      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.latency}ms
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      className={`p-6 rounded-2xl ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                      } backdrop-blur-sm`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Zap className="w-6 h-6 text-yellow-500" />
                        <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Tokens Used
                        </span>
                      </div>
                      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.tokens}
                      </p>
                    </motion.div>
                    
                    <motion.div 
                      className={`p-6 rounded-2xl ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                      } backdrop-blur-sm`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Target className="w-6 h-6 text-green-500" />
                        <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Quality Score
                        </span>
                      </div>
                      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.quality}/10
                      </p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </motion.div>
  );
};