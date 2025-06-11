import React from 'react';
import { Activity, Play, BarChart3, LogOut, User, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  activeTab: 'playground' | 'metrics';
  onTabChange: (tab: 'playground' | 'metrics') => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, activeTab, onTabChange }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  MCP Playground
                </h1>
                <p className="text-xs text-gray-500 font-medium">Model Context Protocol Testing</p>
              </div>
            </div>
            
            <nav className="flex space-x-1">
              <button
                onClick={() => onTabChange('playground')}
                className={`group flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'playground'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:shadow-md'
                }`}
              >
                <Play className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  activeTab === 'playground' ? 'text-white' : ''
                }`} />
                <span>Playground</span>
              </button>
              <button
                onClick={() => onTabChange('metrics')}
                className={`group flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'metrics'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:shadow-md'
                }`}
              >
                <BarChart3 className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  activeTab === 'metrics' ? 'text-white' : ''
                }`} />
                <span>Analytics</span>
              </button>
            </nav>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-white/60 rounded-xl border border-white/20 shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">Demo User</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="group flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Demo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};