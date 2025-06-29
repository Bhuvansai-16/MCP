import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Clock, Target, ChevronDown, ChevronRight, Activity, Database, Play, Download } from 'lucide-react';

interface ExecutionLog {
  id: string;
  timestamp: Date;
  tool: string;
  input: any;
  output: any;
  tokens: number;
  latency: number;
}

interface ExecutionVisualizationProps {
  isDark: boolean;
  executionLogs: ExecutionLog[];
  onClose: () => void;
}

export const ExecutionVisualization: React.FC<ExecutionVisualizationProps> = ({
  isDark,
  executionLogs,
  onClose
}) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'logs' | 'metrics'>('logs');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const calculateMetrics = () => {
    if (executionLogs.length === 0) {
      return {
        totalExecutions: 0,
        totalTokens: 0,
        avgLatency: 0,
        totalLatency: 0,
        toolUsage: {}
      };
    }

    const totalTokens = executionLogs.reduce((sum, log) => sum + log.tokens, 0);
    const totalLatency = executionLogs.reduce((sum, log) => sum + log.latency, 0);
    const avgLatency = totalLatency / executionLogs.length;

    const toolUsage: Record<string, number> = {};
    executionLogs.forEach(log => {
      toolUsage[log.tool] = (toolUsage[log.tool] || 0) + 1;
    });

    return {
      totalExecutions: executionLogs.length,
      totalTokens,
      avgLatency: Math.round(avgLatency),
      totalLatency,
      toolUsage
    };
  };

  const metrics = calculateMetrics();

  // Filter logs by selected tool
  const filteredLogs = selectedTool 
    ? executionLogs.filter(log => log.tool === selectedTool)
    : executionLogs;

  // Get unique tools for filter
  const uniqueTools = Array.from(new Set(executionLogs.map(log => log.tool)));

  // Function to test a tool execution
  const testToolExecution = (tool: string) => {
    console.log(`Testing tool execution: ${tool}`);
    // This would trigger a test execution in a real implementation
  };

  // Function to export logs
  const exportLogs = () => {
    const logsData = JSON.stringify(executionLogs, null, 2);
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'execution-logs.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className={`rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
        isDark 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-white/30 border-white/50'
      } shadow-2xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Activity className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Execution Visualization
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Tool execution logs and performance metrics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Tool Filter */}
            {uniqueTools.length > 0 && (
              <select
                value={selectedTool || ''}
                onChange={(e) => setSelectedTool(e.target.value || null)}
                className={`px-3 py-2 rounded-xl border transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-700/50 border-gray-600 text-white' 
                    : 'bg-white/50 border-gray-200 text-gray-900'
                } backdrop-blur-sm`}
              >
                <option value="">All Tools</option>
                {uniqueTools.map(tool => (
                  <option key={tool} value={tool}>{tool}</option>
                ))}
              </select>
            )}

            {/* Export Button */}
            {executionLogs.length > 0 && (
              <motion.button
                onClick={exportLogs}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                } backdrop-blur-sm`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </motion.button>
            )}

            {/* Tab Selector */}
            <div className={`flex rounded-xl p-1 ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
            }`}>
              <button
                onClick={() => setSelectedTab('logs')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedTab === 'logs'
                    ? isDark
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Logs
              </button>
              <button
                onClick={() => setSelectedTab('metrics')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedTab === 'metrics'
                    ? isDark
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Metrics
              </button>
            </div>

            <motion.button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {selectedTab === 'logs' ? (
            <motion.div
              key="logs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 max-h-96 overflow-y-auto"
            >
              {filteredLogs.length === 0 ? (
                <div className={`text-center py-12 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No execution logs yet</p>
                  <p className="text-sm mt-1">Tool executions will appear here</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    className={`rounded-xl border backdrop-blur-sm ${
                      isDark 
                        ? 'bg-gray-700/30 border-gray-600/30' 
                        : 'bg-white/30 border-gray-200/30'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            {expandedLogs.has(log.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <Zap className="w-4 h-4 text-yellow-500" />
                          </div>
                          <div>
                            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {log.tool}
                            </h4>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatTimestamp(log.timestamp)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span>{log.latency}ms</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3 text-green-500" />
                            <span>{log.tokens} tokens</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedLogs.has(log.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200/20"
                        >
                          <div className="p-4 space-y-3">
                            <div>
                              <h5 className={`text-sm font-medium mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Input:
                              </h5>
                              <div className={`p-3 rounded-lg font-mono text-xs ${
                                isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'
                              }`}>
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(log.input, null, 2)}
                                </pre>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className={`text-sm font-medium mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Output:
                              </h5>
                              <div className={`p-3 rounded-lg font-mono text-xs ${
                                isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'
                              }`}>
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(log.output, null, 2)}
                                </pre>
                              </div>
                            </div>

                            {/* Test Tool Button */}
                            <div className="flex justify-end pt-2">
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  testToolExecution(log.tool);
                                }}
                                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs transition-all duration-300 ${
                                  isDark 
                                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Play className="w-3 h-3" />
                                <span>Test Again</span>
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  className={`p-4 rounded-xl ${
                    isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50/50 border border-blue-200/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                      Executions
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {metrics.totalExecutions}
                  </p>
                </motion.div>

                <motion.div
                  className={`p-4 rounded-xl ${
                    isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50/50 border border-green-200/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      Total Tokens
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {metrics.totalTokens}
                  </p>
                </motion.div>

                <motion.div
                  className={`p-4 rounded-xl ${
                    isDark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50/50 border border-yellow-200/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className={`text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      Avg Latency
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {metrics.avgLatency}ms
                  </p>
                </motion.div>

                <motion.div
                  className={`p-4 rounded-xl ${
                    isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50/50 border border-purple-200/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <span className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                      Total Time
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {metrics.totalLatency}ms
                  </p>
                </motion.div>
              </div>

              {/* Tool Usage */}
              {Object.keys(metrics.toolUsage).length > 0 && (
                <div className={`p-6 rounded-xl ${
                  isDark ? 'bg-gray-700/30' : 'bg-gray-100/30'
                } backdrop-blur-sm`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Tool Usage
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(metrics.toolUsage).map(([tool, count]) => (
                      <div key={tool} className="flex items-center justify-between">
                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {tool}
                        </span>
                        <div className="flex items-center space-x-3">
                          <div className={`flex-1 h-2 rounded-full ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          } w-32`}>
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / metrics.totalExecutions) * 100}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {count}
                          </span>
                          <motion.button
                            onClick={() => testToolExecution(tool)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs transition-all duration-300 ${
                              isDark 
                                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-3 h-3" />
                            <span>Test</span>
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};