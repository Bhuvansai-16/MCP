import React from 'react';
import { Activity, Play, LogOut, User } from 'lucide-react';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  activeTab: 'playground' | 'metrics';
  onTabChange: (tab: 'playground' | 'metrics') => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, activeTab, onTabChange }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">MCP Playground</h1>
            </div>
            
            <nav className="flex space-x-1">
              <button
                onClick={() => onTabChange('playground')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'playground'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Play className="w-4 h-4 inline mr-2" />
                Playground
              </button>
              <button
                onClick={() => onTabChange('metrics')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'metrics'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Metrics
              </button>
            </nav>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};