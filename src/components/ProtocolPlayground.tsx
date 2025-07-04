import React, { useState } from 'react';
import { Play, Settings, FileText, Zap, Clock, Target, Sparkles, Cpu, Network } from 'lucide-react';
import { ProtocolSelector } from './ProtocolSelector';
import { ConfigPanel } from './ConfigPanel';
import { ResultsPanel } from './ResultsPanel';

const generateMockResults = (protocols: string[], prompt: string, document: string) => {
  const mockResponses = {
    raw: `Based on the provided document, I can analyze the content directly. The document contains ${document.length} characters of information. In response to your prompt "${prompt.substring(0, 50)}...", I can provide a comprehensive analysis using the full context available.`,
    
    chain: `I've processed your document using a chain-of-thought approach, breaking it into manageable chunks. Each chunk was analyzed sequentially, building upon previous insights.`,
    
    tree: `Using a tree-based approach, I've analyzed your document through multiple parallel branches for comprehensive coverage.`,
    
    rag: `Retrieved relevant context from the document using semantic search and generated a focused response based on the most relevant passages.`
  };

  return {
    session_id: `session_${Date.now()}`,
    results: protocols.map(protocol => ({
      protocol,
      response: mockResponses[protocol as keyof typeof mockResponses] || `Mock response for ${protocol} protocol`,
      metrics: {
        tokens: Math.floor(Math.random() * 1000) + 500,
        latency_ms: Math.floor(Math.random() * 2000) + 500,
        quality_score: 0.7 + Math.random() * 0.3
      }
    })),
    total_latency_ms: Math.floor(Math.random() * 3000) + 1000
  };
};

export const ProtocolPlayground: React.FC = () => {
  const [prompt, setPrompt] = useState('Analyze the key themes and provide actionable insights from this document.');
  const [document, setDocument] = useState(`# Sample Document for MCP Testing

This is a comprehensive document that demonstrates the capabilities of different Model Context Protocol implementations. 

## Key Concepts

The Model Context Protocol (MCP) represents a significant advancement in how we handle large-scale document processing and analysis.

## Implementation Strategies

### Raw Processing
Direct processing with full context provides maximum information retention.

### Chain Processing  
Sequential chunk processing allows handling of larger documents.

### Tree Processing
Parallel branch analysis enables multi-perspective examination.

### RAG Processing
Retrieval-augmented generation focuses on the most relevant content.

## Conclusion

The MCP Playground provides a powerful environment for testing and comparing these different approaches.`);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(['raw', 'chain']);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [showConfig, setShowConfig] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    if (!prompt.trim() || !document.trim()) {
      return;
    }

    setIsLoading(true);
    setResults(null);

    // Simulate processing
    setTimeout(() => {
      const mockResults = generateMockResults(selectedProtocols, prompt, document);
      setResults(mockResults);
      setIsLoading(false);
    }, 2000);
  };

  const canRun = prompt.trim() && document.trim() && selectedProtocols.length > 0 && !isLoading;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Protocol Playground</h2>
              <p className="text-blue-100 text-lg">Test and compare different Model Context Protocol implementations</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`group flex items-center space-x-2 px-6 py-3 rounded-xl border-2 transition-all duration-200 ${
                  showConfig
                    ? 'bg-white text-blue-600 border-white shadow-lg'
                    : 'border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Configuration</span>
              </button>
              <button
                onClick={handleRun}
                disabled={!canRun}
                className={`group flex items-center space-x-3 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  canRun
                    ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
                    : 'bg-white bg-opacity-20 text-white text-opacity-50 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Run Protocols</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center space-x-2 mb-1">
                <Cpu className="w-4 h-4 text-blue-200" />
                <span className="text-sm font-medium text-blue-200">Protocols</span>
              </div>
              <p className="text-2xl font-bold text-white">{selectedProtocols.length}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4 text-blue-200" />
                <span className="text-sm font-medium text-blue-200">Document</span>
              </div>
              <p className="text-2xl font-bold text-white">{document.length}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center space-x-2 mb-1">
                <Network className="w-4 h-4 text-blue-200" />
                <span className="text-sm font-medium text-blue-200">Status</span>
              </div>
              <p className="text-lg font-bold text-white">{isLoading ? 'Running' : 'Ready'}</p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-4 h-4 text-blue-200" />
                <span className="text-sm font-medium text-blue-200">Mode</span>
              </div>
              <p className="text-lg font-bold text-white">Demo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Input Section */}
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-xl border border-white border-opacity-20 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Input Configuration</span>
            </h3>
            
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Analysis Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your analysis prompt here..."
                  className="w-full h-24 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white bg-opacity-80 backdrop-blur-sm"
                />
              </div>

              {/* Document Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Source Document
                </label>
                <textarea
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="Paste your document content here..."
                  className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white bg-opacity-80 backdrop-blur-sm font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ProtocolSelector
            selectedProtocols={selectedProtocols}
            onProtocolsChange={setSelectedProtocols}
          />
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

      {/* Results */}
      {results && (
        <ResultsPanel results={results} />
      )}
    </div>
  );
};