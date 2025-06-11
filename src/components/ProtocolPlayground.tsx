import React, { useState } from 'react';
import { Play, Settings, FileText, Zap, Clock, Target } from 'lucide-react';
import { ProtocolSelector } from './ProtocolSelector';
import { ConfigPanel } from './ConfigPanel';
import { ResultsPanel } from './ResultsPanel';
import { useProtocolRun } from '../hooks/useProtocolRun';

export const ProtocolPlayground: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [document, setDocument] = useState('');
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(['raw']);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [showConfig, setShowConfig] = useState(false);

  const { runProtocols, results, isLoading, error } = useProtocolRun();

  const handleRun = async () => {
    if (!prompt.trim() || !document.trim()) {
      return;
    }

    await runProtocols({
      prompt: prompt.trim(),
      document: document.trim(),
      protocols: selectedProtocols,
      config
    });
  };

  const canRun = prompt.trim() && document.trim() && selectedProtocols.length > 0 && !isLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Protocol Playground</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showConfig
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Config</span>
            </button>
            <button
              onClick={handleRun}
              disabled={!canRun}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                canRun
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Running...' : 'Run Protocols'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Document Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Document
              </label>
              <textarea
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="Paste your document content here..."
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <ProtocolSelector
              selectedProtocols={selectedProtocols}
              onProtocolsChange={setSelectedProtocols}
            />
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <ConfigPanel
          selectedProtocols={selectedProtocols}
          config={config}
          onConfigChange={setConfig}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <ResultsPanel results={results} />
      )}
    </div>
  );
};