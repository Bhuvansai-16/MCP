import React from 'react';
import { motion } from 'framer-motion';
import { Play, Loader, Terminal, Zap, Sparkles } from 'lucide-react';

interface RunSectionProps {
  isRunning: boolean;
  progress: number;
  logs: string[];
  onRun: () => void;
  canRun: boolean;
  isDark: boolean;
}

export const RunSection: React.FC<RunSectionProps> = ({
  isRunning,
  progress,
  logs,
  onRun,
  canRun,
  isDark
}) => {
  return (
    <motion.div 
      className={`rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
        isDark 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-white/30 border-white/50'
      } shadow-2xl hover:shadow-3xl`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Terminal className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Execution Control
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Run and monitor protocol execution
              </p>
            </div>
          </div>
          
          <motion.button
            onClick={onRun}
            disabled={!canRun}
            className={`relative flex items-center space-x-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
              canRun && !isRunning
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-2xl hover:shadow-3xl'
                : isDark
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/50'
                  : 'bg-gray-200/50 text-gray-500 cursor-not-allowed border border-gray-300/50'
            } backdrop-blur-sm overflow-hidden`}
            whileHover={canRun && !isRunning ? { scale: 1.05 } : {}}
            whileTap={canRun && !isRunning ? { scale: 0.95 } : {}}
          >
            {/* Animated background for active button */}
            {canRun && !isRunning && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            <div className="relative z-10 flex items-center space-x-3">
              {isRunning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader className="w-6 h-6" />
                  </motion.div>
                  <span>Running Protocols...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span>Run All Protocols</span>
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </div>
          </motion.button>
        </div>

        {isRunning && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Zap className="w-4 h-4 inline mr-2" />
                Progress
              </span>
              <span className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className={`relative w-full rounded-full h-3 overflow-hidden ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'
            } backdrop-blur-sm`}>
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        )}

        {logs.length > 0 && (
          <motion.div 
            className={`rounded-2xl border p-6 ${
              isDark 
                ? 'bg-gray-900/50 border-gray-600/50' 
                : 'bg-gray-50/50 border-gray-200/50'
            } backdrop-blur-sm`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <Terminal className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Execution Log
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className={`${isDark ? 'text-green-400' : 'text-green-600'} font-bold`}>
                    [{new Date().toLocaleTimeString()}]
                  </span>{' '}
                  {log}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};