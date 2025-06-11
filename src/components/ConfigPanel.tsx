import React from 'react';
import { Settings } from 'lucide-react';

interface ConfigPanelProps {
  selectedProtocols: string[];
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
}

const protocolConfigs = {
  raw: [
    { key: 'max_tokens', label: 'Max Tokens', type: 'number', default: 500 },
    { key: 'temperature', label: 'Temperature', type: 'number', default: 0.7, step: 0.1, min: 0, max: 2 }
  ],
  chain: [
    { key: 'chunk_size', label: 'Chunk Size', type: 'number', default: 1000 },
    { key: 'overlap', label: 'Overlap', type: 'number', default: 100 },
    { key: 'max_tokens', label: 'Max Tokens', type: 'number', default: 500 }
  ],
  tree: [
    { key: 'branch_factor', label: 'Branch Factor', type: 'number', default: 3 },
    { key: 'max_depth', label: 'Max Depth', type: 'number', default: 2 },
    { key: 'aggregation_method', label: 'Aggregation Method', type: 'select', default: 'synthesis', options: ['synthesis', 'voting', 'weighted'] }
  ],
  rag: [
    { key: 'top_k', label: 'Top K', type: 'number', default: 5 },
    { key: 'similarity_threshold', label: 'Similarity Threshold', type: 'number', default: 0.7, step: 0.1, min: 0, max: 1 },
    { key: 'embedding_model', label: 'Embedding Model', type: 'select', default: 'text-embedding-ada-002', options: ['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large'] }
  ]
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Protocol Configuration</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {selectedProtocols.map((protocol) => {
          const protocolConfig = protocolConfigs[protocol as keyof typeof protocolConfigs];
          if (!protocolConfig) return null;

          return (
            <div key={protocol} className="space-y-4">
              <h4 className="font-medium text-gray-900 capitalize">{protocol} Protocol</h4>
              {protocolConfig.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={config[protocol]?.[field.key] || field.default}
                      onChange={(e) => updateConfig(protocol, field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};