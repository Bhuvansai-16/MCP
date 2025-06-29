'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from '../components/Header';
import { PlaygroundView } from '../components/PlaygroundView';
import { ExploreView } from '../components/ExploreView';
import { CompareView } from '../components/CompareView';
import { CommunityView } from '../components/CommunityView';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

export interface ProtocolResult {
  protocol: string;
  response: string;
  metrics: {
    tokens: number;
    latency: number;
    quality: number;
  };
}

type TabType = 'compare' | 'playground' | 'explore' | 'community';

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('playground');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'compare':
        return <CompareView isDark={isDark} />;
      case 'playground':
        return <PlaygroundView isDark={isDark} />;
      case 'explore':
        return <ExploreView isDark={isDark} />;
      case 'community':
        return <CommunityView isDark={isDark} user={user} />;
      default:
        return <PlaygroundView isDark={isDark} />;
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading MCP.playground...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <Header 
        isDark={isDark} 
        onToggleTheme={toggleTheme}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? 'dark' : 'light'}
        className="z-50"
      />
    </div>
  );
}