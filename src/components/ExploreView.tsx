import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  Shield, 
  Download, 
  Play, 
  Eye, 
  X, 
  Code, 
  Tag, 
  Globe, 
  Users, 
  ExternalLink, 
  Loader, 
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useBackend, WebMCPResult, MCPListItem } from '../hooks/useBackend';

interface ExploreViewProps {
  isDark: boolean;
  onTryInPlayground: (mcp: MCPListItem | WebMCPResult) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ isDark, onTryInPlayground }) => {
  const { 
    getMCPs, 
    searchWebMCPs, 
    enhancedSearchMCPs,
    scrapeSpecificUrl,
    importMCPFromWeb, 
    healthCheck, 
    loading, 
    BACKEND_URL 
  } = useBackend();
  
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
  const [useWebScraping, setUseWebScraping] = useState(true);

  const domains = ['all', 'travel', 'finance', 'development', 'productivity', 'data', 'weather', 'ecommerce', 'social', 'ai', 'communication'];

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
      const healthData = await healthCheck();
      console.log('Backend health check response:', healthData);
      
      if (healthData.status === 'healthy') {
        setBackendStatus('connected');
        console.log('Backend connection successful');
      } else {
        throw new Error('Backend health check failed');
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('error');
      
      if (retryCount < 3) {
        const delay = 2000 * (retryCount + 1); // Exponential backoff
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkBackendConnection();
        }, delay);
      }
    }
  };

  const loadLocalMCPs = async () => {
    try {
      const params: any = {};
      if (selectedDomain !== 'all') params.domain = selectedDomain;
      if (sortBy) params.sort_by = sortBy;
      params.limit = 50;
      params.min_confidence = 0.0;

      console.log('Loading local MCPs with params:', params);
      const mcps = await getMCPs(params);
      console.log('Loaded local MCPs:', mcps);
      setLocalMCPs(mcps);
    } catch (error) {
      console.error('Failed to load local MCPs:', error);
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
        // Enhanced web search with scraping
        console.log('Starting enhanced web search for:', searchQuery);
        
        const searchOptions = {
          sources: useWebScraping ? "github,huggingface,web,scraping" : "github,huggingface",
          min_confidence: 0.0,
          use_scraping: useWebScraping
        };
        
        const results = await searchWebMCPs(searchQuery, 20, searchOptions);
        console.log('Web search results:', results);
        
        setWebMCPs(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportFromWeb = async (webMCP: WebMCPResult) => {
    try {
      console.log('Importing MCP from web:', webMCP);
      const result = await importMCPFromWeb(webMCP.source_url, true);
      
      // Refresh local MCPs to show the newly imported one
      loadLocalMCPs();
      
      // Switch to local mode to see the imported MCP
      setSearchMode('local');
    } catch (error) {
      console.error('Import failed:', error);
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
                  Connecting to enhanced MCP backend with web scraping...
                </span>
              </div>
            </motion.div>
          )}

          {backendStatus === 'connected' && (
            <motion.div 
              className={`mb-6 p-4 rounded-2xl ${
                isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50/50 border border-green-200/50'
              } backdrop-blur-sm`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className={`${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  Connected to enhanced backend with web scraping capabilities
                </span>
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
            </motion.div>
          )}

          {backendStatus === 'error' && retryCount >= 3 && (
            <motion.div 
              className={`mb-6 p-4 rounded-2xl ${
                isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50/50 border border-red-200/50'
              } backdrop-blur-sm`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <span className={`${isDark ? 'text-red-400' : 'text-red-700'} font-medium`}>
                      Backend connection failed
                    </span>
                    <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'} mt-1`}>
                      Please ensure the backend server is running on port 8000
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRetryCount(0);
                    checkBackendConnection();
                  }}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
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
                  Discover Model Context Protocols with enhanced web scraping
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
                    : "🌐 Search web for MCPs with enhanced scraping (e.g., airbnb.bookings, weather API)"
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
                  disabled={isSearching || backendStatus !== 'connected'}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isSearching || backendStatus !== 'connected'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : searchMode === 'local'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                  whileHover={!isSearching && backendStatus === 'connected' ? { scale: 1.05 } : {}}
                  whileTap={!isSearching && backendStatus === 'connected' ? { scale: 0.95 } : {}}
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
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                      🌐 <strong>Enhanced Web Search:</strong> Find MCPs from GitHub, GitLab, HuggingFace, and general web using BeautifulSoup4 scraping.
                    </p>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={useWebScraping}
                        onChange={(e) => setUseWebScraping(e.target.checked)}
                        className="rounded"
                      />
                      <span className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                        Enable Scraping
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Filters - Only show for local search */}
          {searchMode === 'local' && backendStatus === 'connected' && (
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
                  <option value="confidence_score">Sort by Confidence</option>
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
                <span>Found {webMCPs.length} MCPs from the web using {useWebScraping ? 'enhanced scraping' : 'API search'}</span>
              </div>
            </motion.div>
          )}

          {/* Backend Connection Required Message */}
          {backendStatus !== 'connected' && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={`text-6xl mb-4`}>
                🔌
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Backend Connection Required
              </h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                Please ensure the enhanced MCP backend is running on port 8000
              </p>
              <button
                onClick={() => {
                  setRetryCount(0);
                  checkBackendConnection();
                }}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-300"
              >
                Retry Connection
              </button>
            </motion.div>
          )}

          {/* MCP Grid */}
          {backendStatus === 'connected' && (
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
                          {isWebResult && mcp.confidence_score > 0.8 && (
                            <Zap className="w-4 h-4 text-yellow-500" />
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
                            <div className="flex items-center space-x-1">
                              <Zap className="w-4 h-4" />
                              <span>{Math.round(mcp.confidence_score * 100)}%</span>
                            </div>
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
                            <div className="flex items-center space-x-1">
                              <Zap className="w-4 h-4" />
                              <span>{Math.round(mcp.confidence_score * 100)}%</span>
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
                          onTryInPlayground(mcp);
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
          )}

          {/* Empty State */}
          {backendStatus === 'connected' && displayMCPs.length === 0 && !isSearching && (
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
                  : 'Enter a search query to find MCPs from the web using enhanced scraping'
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
                    {/* Modal Header */}
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
                              Confidence
                            </h4>
                            <p className={`text-lg font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              {Math.round(selectedMCP.confidence_score * 100)}%
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
                          onTryInPlayground(selectedMCP);
                          setSelectedMCP(null);
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
                            // Compare feature placeholder
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