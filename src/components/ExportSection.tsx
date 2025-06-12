import React from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, FileText, Database, Link } from 'lucide-react';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import { ProtocolResult } from '../App';

interface ExportSectionProps {
  results: ProtocolResult[];
  isDark: boolean;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ results, isDark }) => {
  const exportToCSV = () => {
    const headers = ['Protocol', 'Latency (ms)', 'Tokens', 'Quality', 'Response'];
    const rows = results.map(result => [
      result.protocol,
      result.metrics.latency.toString(),
      result.metrics.tokens.toString(),
      result.metrics.quality.toString(),
      `"${result.response.replace(/"/g, '""')}"` // Escape quotes for CSV
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `mcp-results-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Results exported to CSV!');
  };

  const generateShareableLink = () => {
    const data = {
      results: results.map(r => ({
        protocol: r.protocol,
        metrics: r.metrics,
        responseLength: r.response.length
      })),
      timestamp: new Date().toISOString()
    };

    const encoded = btoa(JSON.stringify(data));
    const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${encoded}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Shareable link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const exportToJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      results: results
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `mcp-results-${new Date().toISOString().split('T')[0]}.json`);
    toast.success('Results exported to JSON!');
  };

  const exportActions = [
    {
      id: 'csv',
      label: 'Export CSV',
      description: 'Download spreadsheet',
      icon: FileText,
      action: exportToCSV,
      gradient: 'from-green-500 to-emerald-500',
      hoverGradient: 'from-green-600 to-emerald-600'
    },
    {
      id: 'json',
      label: 'Export JSON',
      description: 'Raw data format',
      icon: Database,
      action: exportToJSON,
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'share',
      label: 'Share Results',
      description: 'Generate link',
      icon: Link,
      action: generateShareableLink,
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'from-purple-600 to-pink-600'
    }
  ];

  return (
    <motion.div 
      className={`rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
        isDark 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-white/30 border-white/50'
      } shadow-2xl`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-8">
          <motion.div
            className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Download className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Export & Share
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Save and share your analysis results
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exportActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                onClick={action.action}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                  isDark 
                    ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/30' 
                    : 'border-gray-200/30 bg-white/20 hover:bg-white/30'
                } backdrop-blur-sm hover:shadow-2xl`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Gradient background on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <motion.div
                    className={`p-4 rounded-2xl bg-gradient-to-r ${action.gradient} text-white mb-4 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-8 h-8" />
                  </motion.div>
                  
                  <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {action.label}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {action.description}
                  </p>
                </div>

                {/* Glow effect */}
                <motion.div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}
                />
              </motion.button>
            );
          })}
        </div>

        <motion.div 
          className={`mt-8 p-6 rounded-2xl ${
            isDark ? 'bg-gray-700/30' : 'bg-gray-50/30'
          } backdrop-blur-sm border ${
            isDark ? 'border-gray-600/30' : 'border-gray-200/30'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Export Summary
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {results.length} protocol result{results.length !== 1 ? 's' : ''} ready for export
              </p>
            </div>
            <motion.div
              className="flex items-center space-x-2"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Share2 className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Ready to share
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};