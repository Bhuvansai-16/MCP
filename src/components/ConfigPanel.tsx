import React from 'react';
import { Settings, Sliders, Cpu, Database } from 'lucide-react';

interface ConfigPanelProps {
  selectedProtocols: string[];
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
}

const protocolConfigs = {
  raw: [
    { key: 'max_tokens', label: 'Max Tokens', type: 'number', default: 500, description: 'Maximum tokens in response' },
    { key: 'temperature', label: 'Temperature', type: 'number', default: 0.7, step: 0.1, min: 0, max: 2, description: 'Creativity level (0-2)' }
  ],
  chain: [
    { key: 'chunk_size', label: 'Chunk Size', type: 'number', default: 1000, description: 'Size of each processing chunk' },
    { key: 'overlap', label: 'Overlap', type: 'number', default: 100, description: 'Overlap between chunks' },
    { key: 'max_tokens', label: 'Max Tokens', type: 'number', default: 500, description: 'Maximum tokens per chunk' }
  ],
  tree: [
    { key: 'branch_factor', label: 'Branch Factor', type: 'number', default: 3, description: 'Number of parallel branches' },
    { key: 'max_depth', label: 'Max Depth', type: 'number', default: 2, description: 'Maximum tree depth' },
    { key: 'aggregation_method', label: 'Aggregation', type: 'select', default: 'synthesis', options: ['synthesis', 'voting', 'weighted'], description: 'How to combine results' }
  ],
  rag: [
    { key: 'top_k', label: 'Top K', type: 'number', default: 5, description: 'Number of retrieved chunks' },
    { key: 'similarity_threshold', label: 'Similarity', type: 'number', default: 0.7, step: 0.1, min: 0, max: 1, description: 'Minimum similarity score' },
    { key: 'embedding_model', label: 'Embedding Model', type: 'select', default: 'text-embedding-ada-002', options: ['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large'], description: 'Embedding model to use' }
  ]
};

const protocolIcons = {
  raw: Cpu,
  chain: Sliders,
  tree: Database,
  rag: Database
};

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  selectedProtocols,
  config,
  onConfigChange
}) => {
  const updateConfig = (protocol: string, key: string, value: any) => {
    const newConfig = {
      ...config,
      [protocol]: {
        ...config[protocol],
        [key]: value
      }
    };
    onConfigChange(newConfig);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
      <div className="flex items-center space-x-3 mb-8">
        <Settings className="w-6 h-6 text-gray-700" />
        <h3 className="text-2xl font-bold text-gray-900">Advanced Configuration</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {selectedProtocols.map((protocol) => {
          const protocolConfig = protocolConfigs[protocol as keyof typeof protocolConfigs];
          const ProtocolIcon = protocolIcons[protocol as keyof typeof protocolIcons];
          
          if (!protocolConfig) return null;

          const protocolColors = {
            raw: 'blue',
            chain: 'green', 
            tree: 'purple',
            rag: 'orange'
          };
          
          const color = protocolColors[protocol as keyof typeof protocolColors];

          return (
            <div key={protocol} className={`border-2 border-${color}-200 rounded-xl p-6 bg-${color}-50/50 hover:shadow-lg transition-all duration-200`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 bg-${color}-500 rounded-lg flex items-center justify-center shadow-lg`}>
                  <ProtocolIcon className="w-5 h-5 text-white" />
                </div>
                <h4 className={`text-lg font-bold text-${color}-900 capitalize`}>{protocol}</h4>
              </div>
              
              <div className="space-y-4">
                {protocolConfig.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{field.description}</p>
                    
                    {field.type === 'select' ? (
                      <select
                        value={config[protocol]?.[field.key] || field.default}
                        onChange={(e) => updateConfig(protocol, field.key, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      >
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={config[protocol]?.[field.key] || field.default}
                        onChange={(e) => updateConfig(protocol, field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        step={field.step}
                        min={field.min}
                        max={field.max}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Configuration Status:</strong> {selectedProtocols.length} protocol{selectedProtocols.length !== 1 ? 's' : ''} configured with custom parameters
        </p>
      </div>
    </div>
  );
};