import React, { useState } from 'react';
import { Header } from './components/Header';
import { ProtocolPlayground } from './components/ProtocolPlayground';
import { MetricsDashboard } from './components/MetricsDashboard';
import { Toaster } from './components/Toaster';

function App() {
  const [activeTab, setActiveTab] = useState<'playground' | 'metrics'>('playground');

  // Mock user for demo
  const mockUser = {
    id: '1',
    email: 'demo@example.com'
  };

  const handleLogout = () => {
    console.log('Demo logout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header 
        user={mockUser}
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