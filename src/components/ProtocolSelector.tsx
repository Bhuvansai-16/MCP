import React from 'react';
import { Zap, Link, GitBranch, Search, CheckCircle } from 'lucide-react';

interface ProtocolSelectorProps {
  selectedProtocols: string[];
  onProtocolsChange: (protocols: string[]) => void;
}

const protocols = [
  {
    id: 'raw',
    name: 'Raw Processing',
    description: 'Single pass with full context for maximum information retention',
    icon: Zap,
    color: 'blue',
    features: ['Full Context', 'High Accuracy', 'Token Limited']
  },
  {
    id: 'chain',
    name: 'Chain Processing',
    description: 'Sequential chunk processing with context flow between segments',
    icon: Link,
    color: 'green',
    features: ['Large Documents', 'Sequential', 'Context Flow']
  },
  {
    id: 'tree',
    name: 'Tree Processing',
    description: 'Parallel branch analysis for multi-perspective examination',
    icon: GitBranch,
    color: 'purple',
    features: ['Parallel Processing', 'Multi-Perspective', 'Comprehensive']
  },
  {
    id: 'rag',
    name: 'RAG Processing',
    description: 'Retrieval-augmented generation for precision and relevance',
    icon: Search,
    color: 'orange',
    features: ['Semantic Search', 'High Relevance', 'Efficient']
  }
];

export const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({
  selectedProtocols,
  onProtocolsChange
}) => {
  const toggleProtocol = (protocolId: string) => {
    if (selectedProtocols.includes(protocolId)) {
      onProtocolsChange(selectedProtocols.filter(p => p !== protocolId));
    } else {
      onProtocolsChange([...selectedProtocols, protocolId]);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <CheckCircle className="w-5 h-5 text-blue-600" />
        <span>Protocol Selection</span>
      </h3>
      
      <div className="space-y-3">
        {protocols.map((protocol) => {
          const Icon = protocol.icon;
          const isSelected = selectedProtocols.includes(protocol.id);
          
          return (
            <button
              key={protocol.id}
              onClick={() => toggleProtocol(protocol.id)}
              className={`group w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? `border-${protocol.color}-400 bg-gradient-to-r from-${protocol.color}-50 to-${protocol.color}-100 shadow-lg`
                  : 'border-gray-200 hover:border-gray-300 bg-white/60 hover:bg-white/80 hover:shadow-md'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? `bg-${protocol.color}-500 text-white shadow-lg`
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-semibold ${
                      isSelected ? `text-${protocol.color}-900` : 'text-gray-900'
                    }`}>
                      {protocol.name}
                    </h4>
                    {isSelected && (
                      <CheckCircle className={`w-4 h-4 text-${protocol.color}-600`} />
                    )}
                  </div>
                  <p className={`text-sm mb-2 ${
                    isSelected ? `text-${protocol.color}-700` : 'text-gray-600'
                  }`}>
                    {protocol.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {protocol.features.map((feature, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isSelected
                            ? `bg-${protocol.color}-200 text-${protocol.color}-800`
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>{selectedProtocols.length}</strong> protocol{selectedProtocols.length !== 1 ? 's' : ''} selected
        </p>
      </div>
    </div>
  );
};