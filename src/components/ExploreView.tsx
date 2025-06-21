import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, Shield, Download, Play, Eye, X, Code, Tag, Globe, Users, ExternalLink, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useBackend, WebMCPResult, MCPListItem } from '../hooks/useBackend';
import { toast } from 'react-toastify';

interface ExploreViewProps {
  isDark: boolean;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ isDark }) => {
  const { getMCPs, searchWebMCPs, importMCPFromWeb, healthCheck, loading, BACKEND_URL } = useBackend();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedMCP, setSelectedMCP] = useState<MCPListItem | WebMCPResult | null>(null);
  const [localMCPs, setLocalMCPs] = useState<MCPListItem[]>([]);
  const [webMCPs, setWebMCPs] = useState<WebMCPResult[]>([]);
  const [searchMode, setSearchMode] = useState<'local' | 'web'>('local');
  const [isSearching, setIsSearching] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);

  const domains = ['all', 'travel', 'finance', 'development', 'productivity', 'data', 'weather', 'ecommerce', 'social'];

  // Check backend connectivity on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Load local MCPs when filters change and backend is connected
  useEffect(() => {
    if (backendStatus === 'connected') {
      loadLocalMCPs();
    }
  }, [selectedDomain, sortBy, backendStatus]);

  const checkBackendConnection = async () => {
    setBackendStatus('checking');
    try {
      console.log('Checking backend connection to:', BACKEND_URL);
      await healthCheck();
      setBackendStatus('connected');
      console.log('Backend connection successful');
      toast.success('Connected to MCP backend!');
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('error');
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkBackendConnection();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        toast.error('Failed to connect to backend. Using demo data.');
        loadDemoData();
      }
    }
  };

  const loadDemoData = () => {
    // Load demo MCPs when backend is unavailable
    const demoMCPs: MCPListItem[] = [
      {
        id: 'demo-1',
        name: 'weather.forecast',
        description: 'Real-time weather data and forecasting with global coverage',
        tags: ['weather', 'api', 'forecast'],
        domain: 'weather',
        validated: true,
        popularity: 95,
        source_url: 'https://github.com/example/weather-mcp',
        created_at: new Date().toISOString()
      },
      {
        id: 'demo-2',
        name: 'ecommerce.store',
        description: 'Complete e-commerce functionality with product management',
        tags: ['ecommerce', 'shopping', 'payments'],
        domain: 'ecommerce',
        validated: true,
        popularity: 88,
        source_url: 'https://github.com/example/ecommerce-mcp',
        created_at: new Date().toISOString()
      },
      {
        id: 'demo-3',
        name: 'travel.booking',
        description: 'Travel booking and management with multiple providers',
        tags: ['travel', 'booking', 'hotels'],
        domain: 'travel',
        validated: false,
        popularity: 76,
        source_url: 'https://github.com/example/travel-mcp',
        created_at: new Date().toISOString()
      }
    ];
    setLocalMCPs(demoMCPs);
    setBackendStatus('connected'); // Allow UI to function with demo data
  };

  const loadLocalMCPs = async () => {
    try {
      const params: any = {};
      if (selectedDomain !== 'all') params.domain = selectedDomain;
      if (sortBy) params.sort_by = sortBy;
      params.limit = 50;

      const mcps = await getMCPs(params);
      setLocalMCPs(mcps);
    } catch (error) {
      console.error('Failed to load local MCPs:', error);
      if (backendStatus === 'connected') {
        toast.error('Failed to load MCPs from backend');
        loadDemoData(); // Fallback to demo data
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      if (searchMode === 'local') {
        loadLocalMCPs();
      } else {
        setWebMCPs([]);
      }
      return;
    }

    setIsSearching(true);

    try {
      if (searchMode === 'local') {
        // Filter local MCPs by search query
        const filtered = localMCPs.filter(mcp =>
          mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mcp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mcp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setLocalMCPs(filtered);
      } else {
        // Search web MCPs
        if (backendStatus === 'connected') {
          const results = await searchWebMCPs(searchQuery, 20);
          setWebMCPs(results);
          toast.success(`Found ${results.length} MCPs from the web`);
        } else {
          // Demo web search results
          const demoWebResults: WebMCPResult[] = [
            {
              name: `${searchQuery}.mcp`,
              description: `Demo MCP result for "${searchQuery}" - this would be a real result from web search`,
              source_url: `https://github.com/demo/${searchQuery}-mcp`,
              tags: [searchQuery, 'demo', 'web-search'],
              domain: 'general',
              validated: true,
              file_type: 'json',
              repository: `demo/${searchQuery}-mcp`,
              stars: Math.floor(Math.random() * 100) + 10
            }
          ];
          setWebMCPs(demoWebResults);
          toast.info(`Demo: Found ${demoWebResults.length} results for "${searchQuery}"`);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportFromWeb = async (webMCP: WebMCPResult) => {
    try {
      if (backendStatus === 'connected') {
        const result = await importMCPFromWeb(webMCP.source_url, true);
        toast.success(`Successfully imported ${result.name}!`);
        
        // Refresh local MCPs to show the newly imported one
        loadLocalMCPs();
        
        // Switch to local mode to see the imported MCP
        setSearchMode('local');
      } else {
        // Demo import
        const newMCP: MCPListItem = {
          id: `imported-${Date.now()}`,
          name: webMCP.name,
          description: webMCP.description,
          tags: webMCP.tags,
          domain: webMCP.domain,
          validated: true,
          popularity: 50,
          source_url: webMCP.source_url,
          created_at: new Date().toISOString()
        };
        setLocalMCPs(prev => [newMCP, ...prev]);
        setSearchMode('local');
        toast.success(`Demo: Imported ${webMCP.name}!`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import MCP. Please check the URL and try again.');
    }
  };

  const displayMCPs = searchMode === 'local' ? localMCPs : webMCPs;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden">
      <div className="container mx-auto px-6 py-8 h-full overflow-y-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Backend Status Banner */}
          {backendStatus === 'checking' && (
            <motion.div 
              className={`mb-6 p-4 rounded-2xl ${
                isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50/50 border border-blue-200/50'
              } backdrop-blur-sm`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-3">
                <Loader className="w-5 h-5 animate-spin text-blue-500" />
                <span className={`${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  Connecting to MCP backend...
                </span>
              </div>
            </motion.div>
          )}

          {backendStatus === 'error' && retryCount >= 3 && (
            <motion.div 
              className={`mb-6 p-4 rounded-2xl ${
                isDark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50/50 border border-yellow-200/50'
              } backdrop-blur-sm`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className={`${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    Backend unavailable. Using demo data.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setRetryCount(0);
                    checkBackendConnection();
                  }}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' 
                      : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Search Header */}
          <motion.div 
            className="mb-8"
            variants={itemVariants}
          >
            <div className={`relative p-8 rounded-3xl backdrop-blur-xl border ${
              isDark 
                ? 'bg-gray-800/30 border-gray-700/50' 
                : 'bg-white/30 border-white/50'
            } shadow-2xl`}>
              <div className="text-center mb-6">
                <h1 className={`text-4xl font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Explore MCPs
                </h1>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Discover Model Context Protocols from local library and the web
                </p>
              </div>

              {/* Search Mode Toggle */}
              <div className={`flex justify-center mb-6`}>
                <div className={`flex rounded-2xl p-1 ${
                  isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                } backdrop-blur-sm`}>
                  <button
                    onClick={() => setSearchMode('local')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                      searchMode === 'local'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : isDark
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📚 Local Library
                  </button>
                  <button
                    onClick={() => setSearchMode('web')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                      searchMode === 'web'
                        ? 'bg-purple-500 text-white shadow-lg'
                        : isDark
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🌐 Web Search
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder={searchMode === 'local' 
                    ? "🔍 Search local MCPs (e.g., weather, airbnb)" 
                    : "🌐 Search web for MCPs (e.g., airbnb.bookings, weather API)"
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className={`w-full pl-12 pr-20 py-4 rounded-2xl border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
                />
                <motion.button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isSearching
                      ? 'bg-gray-400 cursor-not-allowed'
                      : searchMode === 'local'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                  whileHover={!isSearching ? { scale: 1.05 } : {}}
                  whileTap={!isSearching ? { scale: 0.95 } : {}}
                >
                  {isSearching ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </motion.button>
              </div>

              {searchMode === 'web' && (
                <div className={`mt-4 p-4 rounded-xl ${
                  isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50/50 border border-purple-200/50'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                    🌐 <strong>Web Search:</strong> Find MCPs from GitHub, HuggingFace, and other repositories. Results will be validated and can be imported directly.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Filters - Only show for local search */}
          {searchMode === 'local' && (
            <motion.div 
              className="flex flex-wrap items-center justify-between gap-4 mb-8"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-4">
                <Filter className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-800/50 border-gray-600 text-white' 
                      : 'bg-white/50 border-gray-200 text-gray-900'
                  } backdrop-blur-sm`}
                >
                  {domains.map(domain => (
                    <option key={domain} value={domain}>
                      {domain === 'all' ? 'All Domains' : domain.charAt(0).toUpperCase() + domain.slice(1)}
                    </option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-800/50 border-gray-600 text-white' 
                      : 'bg-white/50 border-gray-200 text-gray-900'
                  } backdrop-blur-sm`}
                >
                  <option value="popularity">Sort by Popularity</option>
                  <option value="name">Sort by Name</option>
                  <option value="created_at">Sort by Date</option>
                </select>
              </div>

              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {displayMCPs.length} MCPs found
              </div>
            </motion.div>
          )}

          {/* Results Count for Web Search */}
          {searchMode === 'web' && webMCPs.length > 0 && (
            <motion.div 
              className="mb-6 text-center"
              variants={itemVariants}
            >
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl ${
                isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'
              }`}>
                <Globe className="w-4 h-4" />
                <span>Found {webMCPs.length} MCPs from the web</span>
              </div>
            </motion.div>
          )}

          {/* MCP Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {displayMCPs.map((mcp, index) => {
              const isWebResult = 'file_type' in mcp;
              
              return (
                <motion.div
                  key={isWebResult ? mcp.source_url : mcp.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`relative p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
                    isDark 
                      ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50' 
                      : 'bg-white/30 border-white/50 hover:bg-white/50'
                  } shadow-xl hover:shadow-2xl`}
                  onClick={() => setSelectedMCP(mcp)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {mcp.name}
                        </h3>
                        {!isWebResult && 'popularity' in mcp && mcp.popularity > 80 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        {mcp.validated && (
                          <Shield className="w-4 h-4 text-green-500" />
                        )}
                        {isWebResult && (
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                        {mcp.description}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mcp.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isDark 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm">
                      {isWebResult ? (
                        <>
                          <div className="flex items-center space-x-1">
                            <Code className="w-4 h-4" />
                            <span>{mcp.file_type.toUpperCase()}</span>
                          </div>
                          {mcp.stars && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4" />
                              <span>{mcp.stars}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{mcp.popularity}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Globe className="w-4 h-4" />
                            <span>{mcp.domain}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info('Try in Playground feature coming soon!');
                      }}
                    >
                      <Play className="w-4 h-4" />
                      <span>Try in Playground</span>
                    </motion.button>
                    
                    {isWebResult ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-2 rounded-xl border transition-all duration-300 ${
                          isDark 
                            ? 'border-green-600 text-green-400 hover:bg-green-600/10' 
                            : 'border-green-500 text-green-600 hover:bg-green-50'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImportFromWeb(mcp as WebMCPResult);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-2 rounded-xl border transition-all duration-300 ${
                          isDark 
                            ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                            : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info('Compare feature coming soon!');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Empty State */}
          {displayMCPs.length === 0 && !isSearching && backendStatus === 'connected' && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={`text-6xl mb-4`}>
                {searchMode === 'local' ? '📚' : '🌐'}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {searchMode === 'local' ? 'No local MCPs found' : 'No web results yet'}
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchMode === 'local' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Enter a search query to find MCPs from the web'
                }
              </p>
            </motion.div>
          )}

          {/* MCP Detail Modal */}
          <AnimatePresence>
            {selectedMCP && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setSelectedMCP(null)}
                />
                <motion.div
                  className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl backdrop-blur-xl border ${
                    isDark 
                      ? 'bg-gray-800/90 border-gray-700/50' 
                      : 'bg-white/90 border-white/50'
                  } shadow-2xl`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {selectedMCP.name}
                          </h2>
                          {selectedMCP.validated && (
                            <Shield className="w-6 h-6 text-green-500" />
                          )}
                          {'file_type' in selectedMCP && (
                            <ExternalLink className="w-6 h-6 text-blue-500" />
                          )}
                        </div>
                        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                          {selectedMCP.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMCP.tags.map((tag, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 text-sm font-medium rounded-full ${
                                isDark 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              <Tag className="w-3 h-3 inline mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMCP(null)}
                        className={`p-2 rounded-xl transition-colors ${
                          isDark 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className={`p-4 rounded-xl ${
                        isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                      }`}>
                        <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Domain
                        </h4>
                        <p className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {selectedMCP.domain}
                        </p>
                      </div>
                      
                      {'file_type' in selectedMCP ? (
                        <>
                          <div className={`p-4 rounded-xl ${
                            isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                          }`}>
                            <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Repository
                            </h4>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {selectedMCP.repository || 'Unknown'}
                            </p>
                          </div>
                          <div className={`p-4 rounded-xl ${
                            isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                          }`}>
                            <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Stars
                            </h4>
                            <p className={`text-lg font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              {selectedMCP.stars || 0}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`p-4 rounded-xl ${
                            isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                          }`}>
                            <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Popularity
                            </h4>
                            <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                              {selectedMCP.popularity}%
                            </p>
                          </div>
                          <div className={`p-4 rounded-xl ${
                            isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                          }`}>
                            <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Created
                            </h4>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(selectedMCP.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Schema Preview */}
                    {'schema' in selectedMCP && selectedMCP.schema && (
                      <div className="mb-8">
                        <div className="flex items-center space-x-2 mb-4">
                          <Code className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                          <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Schema Preview
                          </h4>
                        </div>
                        <div className={`p-4 rounded-xl border max-h-64 overflow-y-auto ${
                          isDark 
                            ? 'bg-gray-900/50 border-gray-600' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <pre className={`text-sm overflow-x-auto ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {JSON.stringify(selectedMCP.schema, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                        onClick={() => {
                          toast.info('Try in Playground feature coming soon!');
                        }}
                      >
                        <Play className="w-5 h-5" />
                        <span>Try in Playground</span>
                      </motion.button>
                      
                      {'file_type' in selectedMCP ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all duration-300 ${
                            isDark 
                              ? 'border-green-600 text-green-400 hover:bg-green-600/10' 
                              : 'border-green-500 text-green-600 hover:bg-green-50'
                          }`}
                          onClick={() => handleImportFromWeb(selectedMCP as WebMCPResult)}
                        >
                          <Download className="w-5 h-5" />
                          <span>Import MCP</span>
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all duration-300 ${
                            isDark 
                              ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                              : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                          }`}
                          onClick={() => {
                            toast.info('Compare feature coming soon!');
                          }}
                        >
                          <Eye className="w-5 h-5" />
                          <span>Add to Compare</span>
                        </motion.button>
                      )}
                      
                      {selectedMCP.source_url && (
                        <motion.a
                          href={selectedMCP.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all duration-300 ${
                            isDark 
                              ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                              : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                          }`}
                        >
                          <ExternalLink className="w-5 h-5" />
                          <span>View Source</span>
                        </motion.a>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};