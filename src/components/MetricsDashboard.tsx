import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, Clock, Zap, Target } from 'lucide-react';
import { useMetrics } from '../hooks/useMetrics';

export const MetricsDashboard: React.FC = () => {
  const { metrics, loading, error, fetchMetrics } = useMetrics();

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!metrics || metrics.total_runs === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Metrics Available</h3>
        <p className="text-gray-600">Run some protocols to see metrics and analytics here.</p>
      </div>
    );
  }

  const protocolColors = {
    raw: 'blue',
    chain: 'green',
    tree: 'purple',
    rag: 'orange'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Metrics Dashboard</h2>
        </div>
        <p className="text-gray-600">Performance analytics and insights from protocol executions</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Runs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.total_runs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.avg_latency)}ms</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.avg_tokens)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Quality</p>
              <p className="text-2xl font-bold text-gray-900">
                {(metrics.avg_quality * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Protocol Performance</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(metrics.protocol_breakdown).map(([protocol, data]) => {
            const color = protocolColors[protocol as keyof typeof protocolColors] || 'gray';
            
            return (
              <div key={protocol} className={`border-2 border-${color}-200 rounded-lg p-4`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-4 h-4 bg-${color}-500 rounded-full`}></div>
                  <h4 className="font-semibold text-gray-900 capitalize">{protocol} Protocol</h4>
                  <span className={`px-2 py-1 text-xs font-medium bg-${color}-100 text-${color}-700 rounded-full`}>
                    {data.runs} runs
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Latency</p>
                    <p className="text-lg font-bold text-gray-900">{Math.round(data.avg_latency)}ms</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Tokens</p>
                    <p className="text-lg font-bold text-gray-900">{Math.round(data.avg_tokens)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Quality</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(data.avg_quality * 100).toFixed(1)}%
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
};