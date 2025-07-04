import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import { BarChart3, Filter, TrendingUp, Award, Zap, Clock } from 'lucide-react';
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
        borderRadius: 8,
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
        borderRadius: 8,
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
          10 - (result.metrics.latency / maxLatency) * 10,
          10 - (result.metrics.tokens / maxTokens) * 10,
          result.metrics.quality
        ],
        backgroundColor: color.bg.replace('0.8', '0.2'),
        borderColor: color.border,
        borderWidth: 3,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color.border,
      };
    })
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#e5e7eb' : '#374151',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
          lineWidth: 1
        }
      },
      y: {
        ticks: {
          color: isDark ? '#e5e7eb' : '#374151',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
          lineWidth: 1
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
          color: isDark ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
            weight: 'bold'
          }
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
          color: isDark ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        ticks: {
          color: isDark ? '#e5e7eb' : '#374151',
          backdropColor: 'transparent',
          font: {
            weight: 'bold'
          }
        },
        min: 0,
        max: 10
      }
    }
  };

  return (
    <motion.div 
      className={`rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
        isDark 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-white/30 border-white/50'
      } shadow-2xl`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <BarChart3 className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Metrics Dashboard
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Interactive performance analytics
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-3 py-1 rounded-xl border transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-700/50 border-gray-600 text-white backdrop-blur-sm' 
                    : 'bg-white/50 border-gray-200 text-gray-900 backdrop-blur-sm'
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
        <div className="flex flex-wrap gap-3 mb-8">
          {results.map(result => {
            const isVisible = visibleProtocols.includes(result.protocol);
            const color = getProtocolColor(result.protocol);
            
            return (
              <motion.button
                key={result.protocol}
                onClick={() => toggleProtocol(result.protocol)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isVisible
                    ? 'text-white shadow-lg transform scale-105'
                    : isDark
                      ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 border border-gray-600/50'
                      : 'bg-gray-200/50 text-gray-600 hover:bg-gray-300/50 border border-gray-300/50'
                } backdrop-blur-sm`}
                style={isVisible ? { backgroundColor: color.border } : {}}
                whileHover={{ scale: isVisible ? 1.1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {result.protocol.toUpperCase()}
              </motion.button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latency Chart */}
          <motion.div 
            className={`p-6 rounded-2xl ${
              isDark ? 'bg-gray-700/30' : 'bg-gray-50/30'
            } backdrop-blur-sm border ${
              isDark ? 'border-gray-600/30' : 'border-gray-200/30'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Latency Comparison</span>
            </h3>
            <Bar data={latencyData} options={chartOptions} />
          </motion.div>

          {/* Token Usage Chart */}
          <motion.div 
            className={`p-6 rounded-2xl ${
              isDark ? 'bg-gray-700/30' : 'bg-gray-50/30'
            } backdrop-blur-sm border ${
              isDark ? 'border-gray-600/30' : 'border-gray-200/30'
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <h3 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>Token Usage</span>
            </h3>
            <Bar data={tokenData} options={chartOptions} />
          </motion.div>

          {/* Radar Chart */}
          <motion.div 
            className={`lg:col-span-2 p-6 rounded-2xl ${
              isDark ? 'bg-gray-700/30' : 'bg-gray-50/30'
            } backdrop-blur-sm border ${
              isDark ? 'border-gray-600/30' : 'border-gray-200/30'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.01 }}
          >
            <h3 className={`text-lg font-bold mb-4 flex items-center space-x-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span>Overall Performance Radar</span>
            </h3>
            <div className="max-w-md mx-auto">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </motion.div>
        </div>

        {/* Summary Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div 
            className={`p-6 rounded-2xl text-center ${
              isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50/50 border border-blue-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Clock className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h4 className={`font-bold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              Fastest Protocol
            </h4>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {[...results].sort((a, b) => a.metrics.latency - b.metrics.latency)[0]?.protocol.toUpperCase()}
            </p>
          </motion.div>
          
          <motion.div 
            className={`p-6 rounded-2xl text-center ${
              isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50/50 border border-green-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Zap className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h4 className={`font-bold mb-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
              Most Efficient
            </h4>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {[...results].sort((a, b) => a.metrics.tokens - b.metrics.tokens)[0]?.protocol.toUpperCase()}
            </p>
          </motion.div>
          
          <motion.div 
            className={`p-6 rounded-2xl text-center ${
              isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50/50 border border-purple-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Award className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <h4 className={`font-bold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
              Highest Quality
            </h4>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {[...results].sort((a, b) => b.metrics.quality - a.metrics.quality)[0]?.protocol.toUpperCase()}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};