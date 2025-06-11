import React from 'react';
import { CheckSquare, Square, Zap, Link, GitBranch, Search, CheckCircle } from 'lucide-react';

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
    color: 'blue'
  },
  {
    id: 'chain',
    name: 'Sequential Chaining',
    description: 'Break into chunks, process sequentially',
    icon: Link,
    color: 'green'
  },
  {
    id: 'tree',
    name: 'Tree-of-Thought',
    description: 'Parallel branching with multiple perspectives',
    icon: GitBranch,
    color: 'purple'
  },
  {
    id: 'rag',
    name: 'RAG + Summarization',
    description: 'Retrieval-augmented generation approach',
    icon: Search,
    color: 'orange'
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

  return (
    <div className={`rounded-2xl shadow-xl border transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/80 backdrop-blur-sm border-white/20'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Protocol Selection
            </h2>
          </div>
          <button
            onClick={toggleAll}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {selectedProtocols.length === protocols.length ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span>Select All</span>
          </button>
        </div>

        <div className="space-y-3">
          {protocols.map((protocol) => {
            const Icon = protocol.icon;
            const isSelected = selectedProtocols.includes(protocol.id);
            
            return (
              <div
                key={protocol.id}
                onClick={() => toggleProtocol(protocol.id)}
                className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? isDark
                      ? `border-${protocol.color}-500 bg-${protocol.color}-500/10`
                      : `border-${protocol.color}-400 bg-${protocol.color}-50`
                    : isDark
                      ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                      : 'border-gray-200 hover:border-gray-300 bg-white/60'
                } hover:shadow-lg`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? `bg-${protocol.color}-500 text-white`
                      : isDark
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {protocol.name}
                      </h3>
                      {isSelected && (
                        <CheckCircle className={`w-4 h-4 text-${protocol.color}-500`} />
                      )}
                    </div>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {protocol.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`mt-4 p-3 rounded-lg ${
          isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            <strong>{selectedProtocols.length}</strong> protocol{selectedProtocols.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>
    </div>
  );
};