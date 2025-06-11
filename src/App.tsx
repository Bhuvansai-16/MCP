import React, { useState } from 'react';
import { Header } from './components/Header';
import { ProtocolPlayground } from './components/ProtocolPlayground';
import { MetricsDashboard } from './components/MetricsDashboard';
import { Toaster } from './components/Toaster';

// Mock user data for standalone demo
const mockUser = {
  id: '1',
  email: 'demo@mcpplayground.com'
};

function App() {
  const [activeTab, setActiveTab] = useState<'playground' | 'metrics'>('playground');
  const [user] = useState(mockUser);

  const handleLogout = () => {
    // In standalone mode, just show a toast
    (window as any).showToast?.({ 
      type: 'info', 
      message: 'This is a demo - logout functionality disabled' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header 
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'playground' ? (
          <ProtocolPlayground />
        ) : (
          <MetricsDashboard />
        )}
      </main>

      <Toaster />
    </div>
  );
}

export default App;