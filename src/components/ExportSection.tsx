import React from 'react';
import { Download, Share2, FileText } from 'lucide-react';
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

  return (
    <div className={`rounded-2xl shadow-xl border transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/80 backdrop-blur-sm border-white/20'
    }`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Download className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Export & Share
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={exportToCSV}
            className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
              isDark 
                ? 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-400' 
                : 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Export CSV</div>
              <div className="text-sm opacity-75">Download spreadsheet</div>
            </div>
          </button>

          <button
            onClick={exportToJSON}
            className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
              isDark 
                ? 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' 
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Export JSON</div>
              <div className="text-sm opacity-75">Raw data format</div>
            </div>
          </button>

          <button
            onClick={generateShareableLink}
            className={`flex items-center justify-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
              isDark 
                ? 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400' 
                : 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700'
            }`}
          >
            <Share2 className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Share Results</div>
              <div className="text-sm opacity-75">Generate link</div>
            </div>
          </button>
        </div>

        <div className={`mt-4 p-4 rounded-lg ${
          isDark ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <strong>Export Summary:</strong> {results.length} protocol result{results.length !== 1 ? 's' : ''} ready for export
          </p>
        </div>
      </div>
    </div>
  );
};