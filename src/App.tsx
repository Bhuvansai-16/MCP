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

  useEffect(() => {
    if (!user && !isLoading) {
      setShowAuthModal(true);
    }
  }, [user, isLoading]);

  const handleAuthSuccess = (token: string, userData: any) => {
    login(token, userData);
    setShowAuthModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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