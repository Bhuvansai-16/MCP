import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, Zap, Target, BarChart3, PieChart, LineChart } from 'lucide-react';

// Mock metrics data for demonstration
const generateMockMetrics = () => ({
  total_runs: 47,
  avg_latency: 1247,
  avg_tokens: 823,
  avg_quality: 0.847,
  protocol_breakdown: {
    raw: {
      runs: 12,
      avg_latency: 892,
      avg_tokens: 1205,
      avg_quality: 0.823
    },
    chain: {
      runs: 15,
      avg_latency: 1456,
      avg_tokens: 734,
      avg_quality: 0.867
    },
    tree: {
      runs: 11,
      avg_latency: 1678,
      avg_tokens: 945,
      avg_quality: 0.891
    },
    rag: {
      runs: 9,
      avg_latency: 1034,
      avg_tokens: 567,
      avg_quality: 0.798
    }
  }
});

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(generateMockMetrics());
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics || metrics.total_runs === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Available</h3>
        <p className="text-gray-600">Run some protocols to see detailed metrics and analytics here.</p>
      </div>
    );
  }

  const protocolColors = {
    raw: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    chain: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    tree: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    rag: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center space-x-4 mb-2">
            <BarChart3 className="w-8 h-8 text-white" />
            <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>
          </div>
          <p className="text-indigo-100 text-lg">Performance insights and metrics from protocol executions</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Executions</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.total_runs}</p>
            </div>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Latency</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(metrics.avg_latency)}ms</p>
            </div>
          </div>
          <div className="w-full bg-green-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Tokens</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(metrics.avg_tokens)}</p>
            </div>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Quality</p>
              <p className="text-3xl font-bold text-gray-900">
                {(metrics.avg_quality * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="w-full bg-orange-100 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${metrics.avg_quality * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Protocol Performance */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="flex items-center space-x-3 mb-8">
          <PieChart className="w-6 h-6 text-gray-700" />
          <h3 className="text-2xl font-bold text-gray-900">Protocol Performance Breakdown</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Object.entries(metrics.protocol_breakdown).map(([protocol, data]) => {
            const colors = protocolColors[protocol as keyof typeof protocolColors];
            const percentage = (data.runs / metrics.total_runs) * 100;
            
            return (
              <div key={protocol} className={`border-2 ${colors.border} rounded-2xl p-6 hover:shadow-lg transition-all duration-200`}>
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`w-4 h-4 ${colors.bg} rounded-full shadow-sm`}></div>
                  <h4 className="text-xl font-bold text-gray-900 capitalize">{protocol} Protocol</h4>
                  <span className={`px-3 py-1 text-sm font-semibold ${colors.light} ${colors.text} rounded-full`}>
                    {data.runs} runs ({percentage.toFixed(1)}%)
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-semibold text-gray-600">Latency</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(data.avg_latency)}ms</p>
                    <div className={`w-full ${colors.light} rounded-full h-1 mt-2`}>
                      <div className={`${colors.bg} h-1 rounded-full`} style={{ width: `${(data.avg_latency / 2000) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Zap className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-semibold text-gray-600">Tokens</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{Math.round(data.avg_tokens)}</p>
                    <div className={`w-full ${colors.light} rounded-full h-1 mt-2`}>
                      <div className={`${colors.bg} h-1 rounded-full`} style={{ width: `${(data.avg_tokens / 1500) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-semibold text-gray-600">Quality</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(data.avg_quality * 100).toFixed(1)}%
                    </p>
                    <div className={`w-full ${colors.light} rounded-full h-1 mt-2`}>
                      <div className={`${colors.bg} h-1 rounded-full`} style={{ width: `${data.avg_quality * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <LineChart className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Speed Leader</h4>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 mb-2">RAG</p>
            <p className="text-sm text-gray-600">Fastest average response time</p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-700">1,034ms average</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-5 h-5 text-purple-600" />
            <h4 className="text-lg font-semibold text-gray-900">Quality Leader</h4>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 mb-2">Tree</p>
            <p className="text-sm text-gray-600">Highest quality scores</p>
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-700">89.1% average quality</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900">Most Popular</h4>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 mb-2">Chain</p>
            <p className="text-sm text-gray-600">Most frequently used</p>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-700">15 executions (31.9%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};