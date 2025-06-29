import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { PlaygroundView } from './components/PlaygroundView';
import { ExploreView } from './components/ExploreView';
import { CompareView } from './components/CompareView';
import { CommunityView } from './components/CommunityView';
import { AuthModal } from './components/AuthModal';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { MCPListItem, WebMCPResult } from './data/mockMCPs';

export interface ProtocolResult {
  protocol: string;
  response: string;
  metrics: {
    tokens: number;
    latency: number;
    quality: number;
  };
}

export interface MCPSchema {
  name: string;
  version: string;
  description?: string;
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

type TabType = 'compare' | 'playground' | 'explore' | 'community';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('playground');
  const [playgroundMCP, setPlaygroundMCP] = useState<MCPSchema | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [attemptedAction, setAttemptedAction] = useState<string | null>(null);

  // Check authentication for protected actions
  const requireAuth = (action: string, callback: () => void) => {
    if (!isAuthenticated) {
      setAttemptedAction(action);
      setShowAuthModal(true);
      return;
    }
    callback();
  };

  // Handle tab changes with auth check
  const handleTabChange = (tab: TabType) => {
    if (tab === 'community' && !isAuthenticated) {
      requireAuth('access community features', () => setActiveTab(tab));
      return;
    }
    setActiveTab(tab);
  };

  // Function to handle "Try in Playground" from any tab
  const handleTryInPlayground = async (mcp: MCPListItem | WebMCPResult) => {
    requireAuth('try MCP in playground', () => {
      try {
        let mcpSchema: MCPSchema;

        // Check if it's a WebMCPResult with schema
        if ('schema' in mcp && mcp.schema) {
          mcpSchema = mcp.schema as MCPSchema;
        } else {
          // Generate a mock schema based on the MCP data
          mcpSchema = {
            name: mcp.name,
            version: "1.0.0",
            description: mcp.description,
            tools: generateToolsFromMCP(mcp)
          };
        }

        // Set the MCP in playground
        setPlaygroundMCP(mcpSchema);
        
        // Switch to playground tab
        setActiveTab('playground');

      } catch (error) {
        console.error('Failed to load MCP in playground:', error);
      }
    });
  };

  // Handle successful authentication
  const handleAuthSuccess = (token: string, userData: any) => {
    setShowAuthModal(false);
    
    // Execute the attempted action if any
    if (attemptedAction) {
      switch (attemptedAction) {
        case 'access community features':
          setActiveTab('community');
          break;
        case 'try MCP in playground':
          // The action will be retried automatically
          break;
      }
      setAttemptedAction(null);
    }
  };

  // Generate tools based on MCP metadata
  const generateToolsFromMCP = (mcp: MCPListItem | WebMCPResult): MCPSchema['tools'] => {
    const tools: MCPSchema['tools'] = [];

    // Generate tools based on domain and tags
    if (mcp.domain === 'weather' || mcp.tags.includes('weather')) {
      tools.push(
        {
          name: "get_current_weather",
          description: "Get current weather for a location",
          parameters: {
            location: "string",
            units: "string"
          }
        },
        {
          name: "get_forecast",
          description: "Get weather forecast",
          parameters: {
            location: "string",
            days: "number"
          }
        }
      );
    }

    if (mcp.domain === 'ecommerce' || mcp.tags.includes('ecommerce')) {
      tools.push(
        {
          name: "search_products",
          description: "Search for products",
          parameters: {
            query: "string",
            category: "string",
            price_range: "object"
          }
        },
        {
          name: "add_to_cart",
          description: "Add product to cart",
          parameters: {
            product_id: "string",
            quantity: "number"
          }
        }
      );
    }

    if (mcp.domain === 'productivity' || mcp.tags.includes('calendar')) {
      tools.push(
        {
          name: "create_event",
          description: "Create calendar event",
          parameters: {
            title: "string",
            start_time: "datetime",
            end_time: "datetime"
          }
        },
        {
          name: "list_events",
          description: "List upcoming events",
          parameters: {
            start_date: "date",
            end_date: "date"
          }
        }
      );
    }

    if (mcp.domain === 'finance' || mcp.tags.includes('finance')) {
      tools.push(
        {
          name: "get_balance",
          description: "Get account balance",
          parameters: {
            account_id: "string"
          }
        },
        {
          name: "transfer_funds",
          description: "Transfer funds between accounts",
          parameters: {
            from_account: "string",
            to_account: "string",
            amount: "number"
          }
        }
      );
    }

    if (mcp.domain === 'travel' || mcp.tags.includes('travel')) {
      tools.push(
        {
          name: "search_flights",
          description: "Search for flights",
          parameters: {
            origin: "string",
            destination: "string",
            date: "date"
          }
        },
        {
          name: "book_hotel",
          description: "Book hotel accommodation",
          parameters: {
            location: "string",
            check_in: "date",
            check_out: "date"
          }
        }
      );
    }

    if (mcp.domain === 'social' || mcp.tags.includes('social')) {
      tools.push(
        {
          name: "post_message",
          description: "Post message to social media",
          parameters: {
            platform: "string",
            message: "string",
            media: "array"
          }
        },
        {
          name: "get_analytics",
          description: "Get social media analytics",
          parameters: {
            platform: "string",
            period: "string"
          }
        }
      );
    }

    if (mcp.domain === 'development' || mcp.tags.includes('filesystem')) {
      tools.push(
        {
          name: "read_file",
          description: "Read file contents",
          parameters: {
            path: "string"
          }
        },
        {
          name: "write_file",
          description: "Write file contents",
          parameters: {
            path: "string",
            content: "string"
          }
        }
      );
    }

    // If no specific tools were generated, create generic ones
    if (tools.length === 0) {
      tools.push(
        {
          name: "execute_action",
          description: `Execute ${mcp.name} action`,
          parameters: {
            action: "string",
            parameters: "object"
          }
        },
        {
          name: "get_status",
          description: `Get ${mcp.name} status`,
          parameters: {
            resource_id: "string"
          }
        }
      );
    }

    return tools;
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'compare':
        return <CompareView isDark={isDark} onTryInPlayground={handleTryInPlayground} />;
      case 'playground':
        return <PlaygroundView isDark={isDark} initialMCP={playgroundMCP} />;
      case 'explore':
        return <ExploreView isDark={isDark} onTryInPlayground={handleTryInPlayground} />;
      case 'community':
        return <CommunityView isDark={isDark} user={user} onTryInPlayground={handleTryInPlayground} />;
      default:
        return <PlaygroundView isDark={isDark} initialMCP={playgroundMCP} />;
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

      {/* Main App Container - 80% width */}
      <div className="w-full max-w-[80vw] mx-auto min-h-screen">
        <Header 
          isDark={isDark} 
          onToggleTheme={toggleTheme}
          activeTab={activeTab}
          onTabChange={handleTabChange}
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
      </div>

      {/* Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onClose={() => {
              setShowAuthModal(false);
              setAttemptedAction(null);
            }}
            onAuthSuccess={handleAuthSuccess}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;