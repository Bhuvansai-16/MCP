import React, { useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Copy, Check, LayoutGrid, Clock, Zap, Target } from 'lucide-react';
import { toast } from 'react-toastify';
import { ProtocolResult } from '../App';

interface ResultsSectionProps {
  results: ProtocolResult[];
  isDark: boolean;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ results, isDark }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sideByView, setSideByView] = useState(false);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success('Response copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const getProtocolColor = (protocol: string) => {
    const colors = {
      raw: 'blue',
      chain: 'green',
      tree: 'purple',
      rag: 'orange'
    };
    return colors[protocol as keyof typeof colors] || 'blue';
  };

  if (sideByView) {
    return (
      <div className={`rounded-2xl shadow-xl border transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white/80 backdrop-blur-sm border-white/20'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Side-by-Side Comparison
            </h2>
            <button
              onClick={() => setSideByView(false)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Tab View</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((result, index) => {
              const color = getProtocolColor(result.protocol);
              return (
                <div key={index} className={`border-2 rounded-xl p-4 ${
                  isDark 
                    ? `border-${color}-500/30 bg-${color}-500/5` 
                    : `border-${color}-200 bg-${color}-50/50`
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold capitalize ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {result.protocol}
                    </h3>
                    <button
                      onClick={() => copyToClipboard(result.response, index)}
                      className={`p-2 rounded-lg transition-colors ${
                        copiedIndex === index
                          ? 'bg-green-500 text-white'
                          : isDark
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className={`rounded-lg p-4 mb-4 ${
                    isDark ? 'bg-gray-900' : 'bg-white'
                  }`}>
                    <p className={`text-sm leading-relaxed ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {result.response}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Latency
                        </span>
                      </div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.latency}ms
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Zap className="w-4 h-4 text-gray-500" />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Tokens
                        </span>
                      </div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.tokens}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Quality
                        </span>
                      </div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.quality}/10
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl shadow-xl border transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/80 backdrop-blur-sm border-white/20'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Protocol Results
          </h2>
          <button
            onClick={() => setSideByView(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Side-by-Side Compare</span>
          </button>
        </div>

        <Tabs className={`react-tabs ${isDark ? 'dark' : ''}`}>
          <TabList className={`flex space-x-1 p-1 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            {results.map((result, index) => {
              const color = getProtocolColor(result.protocol);
              return (
                <Tab
                  key={index}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                  selectedClassName={`${
                    isDark 
                      ? `bg-${color}-600 text-white` 
                      : `bg-${color}-500 text-white`
                  } shadow-lg`}
                >
                  <span className="capitalize">{result.protocol}</span>
                </Tab>
              );
            })}
          </TabList>

          {results.map((result, index) => (
            <TabPanel key={index} className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold capitalize ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {result.protocol} Response
                    </h3>
                    <button
                      onClick={() => copyToClipboard(result.response, index)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                        copiedIndex === index
                          ? 'bg-green-500 text-white'
                          : isDark
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
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
                  
                  <div className={`rounded-xl p-6 border-2 max-h-96 overflow-y-auto ${
                    isDark 
                      ? 'bg-gray-900 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`leading-relaxed ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {result.response}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Metrics
                  </h3>
                  
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Latency
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.latency}ms
                      </p>
                    </div>
                    
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Tokens Used
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.tokens}
                      </p>
                    </div>
                    
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-5 h-5 text-green-500" />
                        <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Quality Score
                        </span>
                      </div>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {result.metrics.quality}/10
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </div>
  );
};