import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, Zap, Link, GitBranch, Search, CheckCircle, Info } from 'lucide-react';

interface ProtocolSelectionProps {
  selectedProtocols: string[];
  onProtocolsChange: (protocols: string[]) => void;
  isDark: boolean;
}

const protocols = [
  {
    id: 'raw',
    name: 'Raw Prompting',
    description: 'Direct processing with full context',
    icon: Zap,
    color: 'blue',
    tooltip: 'Single pass with complete document context for maximum accuracy'
  },
  {
    id: 'chain',
    name: 'Sequential Chaining',
    description: 'Break into chunks, process sequentially',
    icon: Link,
    color: 'green',
    tooltip: 'Process document in sequential chunks with context flow'
  },
  {
    id: 'tree',
    name: 'Tree-of-Thought',
    description: 'Parallel branching with multiple perspectives',
    icon: GitBranch,
    color: 'purple',
    tooltip: 'Multiple parallel analysis branches for comprehensive coverage'
  },
  {
    id: 'rag',
    name: 'RAG + Summarization',
    description: 'Retrieval-augmented generation approach',
    icon: Search,
    color: 'orange',
    tooltip: 'Semantic search and retrieval for focused responses'
  }
];

export const ProtocolSelection: React.FC<ProtocolSelectionProps> = ({
  selectedProtocols,
  onProtocolsChange,
  isDark
}) => {
  const toggleProtocol = (protocolId: string) => {
    if (selectedProtocols.includes(protocolId)) {
      onProtocolsChange(selectedProtocols.filter(p => p !== protocolId));
    } else {
      onProtocolsChange([...selectedProtocols, protocolId]);
    }
  };

  const toggleAll = () => {
    if (selectedProtocols.length === protocols.length) {
      onProtocolsChange([]);
    } else {
      onProtocolsChange(protocols.map(p => p.id));
    }
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
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };

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
              className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-blue-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Protocol Selection
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose analysis strategies to compare
              </p>
            </div>
          </div>
          <motion.button
            onClick={toggleAll}
            className={`flex items-center space-x-2 px-3 py-1 rounded-xl text-sm transition-all duration-300 ${
              isDark 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {selectedProtocols.length === protocols.length ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>Select All</span>
          </motion.button>
        </div>

        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {protocols.map((protocol) => {
            const Icon = protocol.icon;
            const isSelected = selectedProtocols.includes(protocol.id);
            
            return (
              <motion.div
                key={protocol.id}
                variants={itemVariants}
                onClick={() => toggleProtocol(protocol.id)}
                className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? isDark
                      ? `border-${protocol.color}-500/50 bg-${protocol.color}-500/10 shadow-lg shadow-${protocol.color}-500/20`
                      : `border-${protocol.color}-400/50 bg-${protocol.color}-50/50 shadow-lg shadow-${protocol.color}-400/20`
                    : isDark
                      ? 'border-gray-600/30 hover:border-gray-500/50 bg-gray-700/20 hover:bg-gray-700/30'
                      : 'border-gray-200/30 hover:border-gray-300/50 bg-white/20 hover:bg-white/30'
                } hover:shadow-xl backdrop-blur-sm`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start space-x-4">
                  <motion.div 
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      isSelected
                        ? `bg-gradient-to-br from-${protocol.color}-500 to-${protocol.color}-600 text-white shadow-lg`
                        : isDark
                          ? 'bg-gray-600/50 text-gray-300 group-hover:bg-gray-500/50'
                          : 'bg-gray-100/50 text-gray-600 group-hover:bg-gray-200/50'
                    }`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className={`font-bold text-lg ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {protocol.name}
                      </h3>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`text-${protocol.color}-500`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </motion.div>
                      )}
                      <div className="group/tooltip relative">
                        <Info className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} cursor-help`} />
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-10 ${
                          isDark ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
                        } shadow-lg backdrop-blur-sm`}>
                          {protocol.tooltip}
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {protocol.description}
                    </p>
                  </div>
                </div>
                
                {/* Glow effect for selected items */}
                {isSelected && (
                  <motion.div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-${protocol.color}-500/20 to-${protocol.color}-600/20 blur-xl`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div 
          className={`mt-6 p-4 rounded-2xl ${
            isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50/50 border border-blue-200/50'
          } backdrop-blur-sm`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            <strong>{selectedProtocols.length}</strong> protocol{selectedProtocols.length !== 1 ? 's' : ''} selected for comparison
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};