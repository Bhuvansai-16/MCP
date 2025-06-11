import React from 'react';
import { Zap, Link, GitBranch, Search } from 'lucide-react';

interface ProtocolSelectorProps {
  selectedProtocols: string[];
  onProtocolsChange: (protocols: string[]) => void;
}

const protocols = [
  {
    id: 'raw',
    name: 'Raw',
    description: 'Single pass with full context',
    icon: Zap,
    color: 'blue'
  },
  {
    id: 'chain',
    name: 'Chain',
    description: 'Split into chunks, process sequentially',
    icon: Link,
    color: 'green'
  },
  {
    id: 'tree',
    name: 'Tree',
    description: 'Branching parallel calls with aggregation',
    icon: GitBranch,
    color: 'purple'
  },
  {
    id: 'rag',
    name: 'RAG',
    description: 'Embedding retrieval + summarization',
    icon: Search,
    color: 'orange'
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Protocols
      </label>
      <div className="space-y-2">
        {protocols.map((protocol) => {
          const Icon = protocol.icon;
          const isSelected = selectedProtocols.includes(protocol.id);
          
          return (
            <button
              key={protocol.id}
              onClick={() => toggleProtocol(protocol.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? `border-${protocol.color}-500 bg-${protocol.color}-50`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-1 rounded ${
                  isSelected
                    ? `bg-${protocol.color}-500 text-white`
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${
                    isSelected ? `text-${protocol.color}-900` : 'text-gray-900'
                  }`}>
                    {protocol.name}
                  </h3>
                  <p className={`text-sm ${
                    isSelected ? `text-${protocol.color}-700` : 'text-gray-600'
                  }`}>
                    {protocol.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};