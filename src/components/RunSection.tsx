import React from 'react';
import { Play, Loader, Terminal } from 'lucide-react';

interface RunSectionProps {
  isRunning: boolean;
  progress: number;
  logs: string[];
  onRun: () => void;
  canRun: boolean;
  isDark: boolean;
}

export const RunSection: React.FC<RunSectionProps> = ({
  isRunning,
  progress,
  logs,
  onRun,
  canRun,
  isDark
}) => {
  return (
    <div className={`rounded-2xl shadow-xl border transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/80 backdrop-blur-sm border-white/20'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Terminal className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Execution Control
            </h2>
          </div>
          
          <button
            onClick={onRun}
            disabled={!canRun}
            className={`flex items-center space-x-3 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
              canRun && !isRunning
                ? isDark
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
                : isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isRunning ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Running Protocols...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Run All Protocols</span>
              </>
            )}
          </button>
        </div>

        {isRunning && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Progress
              </span>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {Math.round(progress)}%
              </span>
            </div>
            <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className={`rounded-xl border p-4 ${
            isDark 
              ? 'bg-gray-900 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <Terminal className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Execution Log
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <span className={`${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    [{new Date().toLocaleTimeString()}]
                  </span>{' '}
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};