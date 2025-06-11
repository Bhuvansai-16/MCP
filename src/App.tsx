import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProtocolPlayground } from './components/ProtocolPlayground';
import { MetricsDashboard } from './components/MetricsDashboard';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import { Toaster } from './components/Toaster';

function App() {
  const [activeTab, setActiveTab] = useState<'playground' | 'metrics'>('playground');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, login, logout, isLoading } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('App mounted, user:', user, 'isLoading:', isLoading);
  }, [user, isLoading]);

  useEffect(() => {
    if (!user && !isLoading) {
      console.log('No user found, showing auth modal');
      setShowAuthModal(true);
    }
  }, [user, isLoading]);

  const handleAuthSuccess = (token: string, userData: any) => {
    console.log('Auth success, user data:', userData);
    login(token, userData);
    setShowAuthModal(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MCP Playground...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        onLogout={logout}
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

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      <Toaster />
    </div>
  );
}

export default App;