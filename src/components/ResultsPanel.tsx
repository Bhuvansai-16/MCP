import React, { useState } from 'react';
import { Clock, Zap, Target, Copy, Check, Download, Share2, Eye } from 'lucide-react';

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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      (window as any).showToast?.({ type: 'success', message: 'Response copied to clipboard!' });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      (window as any).showToast?.({ type: 'error', message: 'Failed to copy text' });
    }
  };

  const getProtocolColor = (protocol: string) => {
    const colors = {
      raw: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600' },
      chain: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', gradient: 'from-green-500 to-green-600' },
      tree: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', gradient: 'from-purple-500 to-purple-600' },
      rag: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', gradient: 'from-orange-500 to-orange-600' }
    };
    return colors[protocol as keyof typeof colors] || colors.raw;
  };

  const formatQualityScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Execution Summary */}
      <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <Eye className="w-6 h-6" />
            <span>Execution Results</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-blue-300" />
                <span className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Total Time</span>
              </div>
              <p className="text-3xl font-bold text-white">{results.total_latency_ms}ms</p>
              <div className="mt-2 w-full bg-white/20 rounded-full h-1">
                <div className="bg-blue-400 h-1 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="w-5 h-5 text-green-300" />
                <span className="text-sm font-semibold text-green-300 uppercase tracking-wide">Protocols</span>
              </div>
              <p className="text-3xl font-bold text-white">{results.results.length}</p>
              <div className="mt-2 w-full bg-white/20 rounded-full h-1">
                <div className="bg-green-400 h-1 rounded-full" style={{ width: `${(results.results.length / 4) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-3 mb-2">
                <Target className="w-5 h-5 text-purple-300" />
                <span className="text-sm font-semibold text-purple-300 uppercase tracking-wide">Avg Quality</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatQualityScore(
                  results.results.reduce((sum, r) => sum + r.metrics.quality_score, 0) / results.results.length
                )}
              </p>
              <div className="mt-2 w-full bg-white/20 rounded-full h-1">
                <div className="bg-purple-400 h-1 rounded-full" style={{ 
                  width: `${(results.results.reduce((sum, r) => sum + r.metrics.quality_score, 0) / results.results.length) * 100}%` 
                }}></div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-3 mb-2">
                <Share2 className="w-5 h-5 text-orange-300" />
                <span className="text-sm font-semibold text-orange-300 uppercase tracking-wide">Session</span>
              </div>
              <p className="text-sm font-mono text-white truncate">{results.session_id}</p>
              <button
                onClick={() => copyToClipboard(results.session_id, -1)}
                className="mt-2 text-xs text-orange-300 hover:text-orange-200 transition-colors"
              >
                Copy Session ID
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Protocol Results */}
      <div className="space-y-6">
        {results.results.map((result, index) => {
          const colors = getProtocolColor(result.protocol);
          const isExpanded = expandedIndex === index;
          
          return (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className={`bg-gradient-to-r ${colors.gradient} px-8 py-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-white rounded-full shadow-lg"></div>
                    <h4 className="text-2xl font-bold text-white capitalize">
                      {result.protocol} Protocol
                    </h4>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(result.response, index)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        copiedIndex === index
                          ? 'bg-green-500 text-white'
                          : 'bg-white/20 hover:bg-white/30 text-white'
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
                </div>
                
                <div className="flex items-center space-x-8 mt-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-white/80" />
                    <span className="text-white font-semibold">{result.metrics.latency_ms}ms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-white/80" />
                    <span className="text-white font-semibold">{result.metrics.tokens} tokens</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-white/80" />
                    <span className="text-white font-semibold">
                      {formatQualityScore(result.metrics.quality_score)} quality
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className={`transition-all duration-300 ${isExpanded ? 'max-h-none' : 'max-h-32 overflow-hidden'}`}>
                  <div className="prose max-w-none">
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-medium leading-relaxed">
                        {result.response}
                      </pre>
                    </div>
                  </div>
                </div>
                
                {!isExpanded && result.response.length > 200 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setExpandedIndex(index)}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Show full response...
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};