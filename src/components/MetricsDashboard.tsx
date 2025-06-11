import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { BarChart3, Filter, TrendingUp } from 'lucide-react';
import { ProtocolResult } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MetricsDashboardProps {
  results: ProtocolResult[];
  isDark: boolean;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ results, isDark }) => {
  const [visibleProtocols, setVisibleProtocols] = useState<string[]>(
    results.map(r => r.protocol)
  );
  const [sortBy, setSortBy] = useState<'latency' | 'tokens' | 'quality'>('latency');

  const filteredResults = results.filter(r => visibleProtocols.includes(r.protocol));

  const toggleProtocol = (protocol: string) => {
    if (visibleProtocols.includes(protocol)) {
      setVisibleProtocols(visibleProtocols.filter(p => p !== protocol));
    } else {
      setVisibleProtocols([...visibleProtocols, protocol]);
    }
  };

  const getProtocolColor = (protocol: string) => {
    const colors = {
      raw: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' },
      chain: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' },
      tree: { bg: 'rgba(147, 51, 234, 0.8)', border: 'rgb(147, 51, 234)' },
      rag: { bg: 'rgba(249, 115, 22, 0.8)', border: 'rgb(249, 115, 22)' }
    };
    return colors[protocol as keyof typeof colors] || colors.raw;
  };

  const latencyData = {
    labels: filteredResults.map(r => r.protocol.toUpperCase()),
    datasets: [
      {
        label: 'Latency (ms)',
        data: filteredResults.map(r => r.metrics.latency),
        backgroundColor: filteredResults.map(r => getProtocolColor(r.protocol).bg),
        borderColor: filteredResults.map(r => getProtocolColor(r.protocol).border),
        borderWidth: 2,
      },
    ],
  };

  const tokenData = {
    labels: filteredResults.map(r => r.protocol.toUpperCase()),
    datasets: [
      {
        label: 'Tokens Used',
        data: filteredResults.map(r => r.metrics.tokens),
        backgroundColor: filteredResults.map(r => getProtocolColor(r.protocol).bg),
        borderColor: filteredResults.map(r => getProtocolColor(r.protocol).border),
        borderWidth: 2,
      },
    ],
  };

  const radarData = {
    labels: ['Latency (normalized)', 'Tokens (normalized)', 'Quality'],
    datasets: filteredResults.map(result => {
      const color = getProtocolColor(result.protocol);
      const maxLatency = Math.max(...results.map(r => r.metrics.latency));
      const maxTokens = Math.max(...results.map(r => r.metrics.tokens));
      
      return {
        label: result.protocol.toUpperCase(),
        data: [
          10 - (result.metrics.latency / maxLatency) * 10, // Inverted for better visualization
          10 - (result.metrics.tokens / maxTokens) * 10, // Inverted for better visualization
          result.metrics.quality
        ],
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
      };
    })
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151'
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#e5e7eb' : '#374151'
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        ticks: {
          color: isDark ? '#e5e7eb' : '#374151'
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb'
        }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151'
        }
      },
    },
    scales: {
      r: {
        angleLines: {
          color: isDark ? '#374151' : '#e5e7eb'
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb'
        },
        pointLabels: {
          color: isDark ? '#e5e7eb' : '#374151'
        },
        ticks: {
          color: isDark ? '#e5e7eb' : '#374151',
          backdropColor: 'transparent'
        },
        min: 0,
        max: 10
      }
    }
  };

  return (
    <div className={`rounded-2xl shadow-xl border transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/80 backdrop-blur-sm border-white/20'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Metrics Dashboard
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-3 py-1 rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value="latency">Sort by Latency</option>
                <option value="tokens">Sort by Tokens</option>
                <option value="quality">Sort by Quality</option>
              </select>
            </div>
          </div>
        </div>

        {/* Protocol Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {results.map(result => {
            const isVisible = visibleProtocols.includes(result.protocol);
            const color = getProtocolColor(result.protocol);
            
            return (
              <button
                key={result.protocol}
                onClick={() => toggleProtocol(result.protocol)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isVisible
                    ? `text-white shadow-lg`
                    : isDark
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                style={isVisible ? { backgroundColor: color.border } : {}}
              >
                {result.protocol.toUpperCase()}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latency Chart */}
          <div className={`p-4 rounded-xl ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <TrendingUp className="w-5 h-5" />
              <span>Latency Comparison</span>
            </h3>
            <Bar data={latencyData} options={chartOptions} />
          </div>

          {/* Token Usage Chart */}
          <div className={`p-4 rounded-xl ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center space-x-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <BarChart3 className="w-5 h-5" />
              <span>Token Usage</span>
            </h3>
            <Bar data={tokenData} options={chartOptions} />
          </div>

          {/* Radar Chart */}
          <div className={`lg:col-span-2 p-4 rounded-xl ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Overall Performance Radar
            </h3>
            <div className="max-w-md mx-auto">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className={`p-4 rounded-xl text-center ${
            isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              Fastest Protocol
            </h4>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {[...results].sort((a, b) => a.metrics.latency - b.metrics.latency)[0]?.protocol.toUpperCase()}
            </p>
          </div>
          
          <div className={`p-4 rounded-xl text-center ${
            isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
              Most Efficient
            </h4>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {[...results].sort((a, b) => a.metrics.tokens - b.metrics.tokens)[0]?.protocol.toUpperCase()}
            </p>
          </div>
          
          <div className={`p-4 rounded-xl text-center ${
            isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
              Highest Quality
            </h4>
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {[...results].sort((a, b) => b.metrics.quality - a.metrics.quality)[0]?.protocol.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};