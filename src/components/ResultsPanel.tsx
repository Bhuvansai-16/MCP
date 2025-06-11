import React, { useState } from 'react';
import { Clock, Zap, Target, Copy, Check } from 'lucide-react';

interface Result {
  protocol: string;
  response: string;
  metrics: {
    tokens: number;
    latency_ms: number;
    quality_score: number;
  };
}

interface ResultsPanelProps {
  results: {
    session_id: string;
    results: Result[];
    total_latency_ms: number;
  };
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ results }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getProtocolColor = (protocol: string) => {
    const colors = {
      raw: 'blue',
      chain: 'green',
      tree: 'purple',
      rag: 'orange'
    };
    return colors[protocol as keyof typeof colors] || 'gray';
  };

  const formatQualityScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Total Time</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{results.total_latency_ms}ms</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Protocols Run</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{results.results.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Avg Quality</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatQualityScore(
                results.results.reduce((sum, r) => sum + r.metrics.quality_score, 0) / results.results.length
              )}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-600">Session ID</span>
            </div>
            <p className="text-sm font-mono text-gray-700 truncate">{results.session_id}</p>
          </div>
        </div>
      </div>

      {/* Individual Results */}
      <div className="space-y-4">
        {results.results.map((result, index) => {
          const color = getProtocolColor(result.protocol);
          
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`bg-${color}-50 border-b border-${color}-100 px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 bg-${color}-500 rounded-full`}></div>
                    <h4 className={`text-lg font-semibold text-${color}-900 capitalize`}>
                      {result.protocol} Protocol
                    </h4>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.response, index)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                      copiedIndex === index
                        ? 'bg-green-100 text-green-700'
                        : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
                    }`}
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center space-x-6 mt-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{result.metrics.latency_ms}ms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{result.metrics.tokens} tokens</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      {formatQualityScore(result.metrics.quality_score)} quality
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    {result.response}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};