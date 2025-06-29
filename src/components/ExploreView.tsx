import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  Eye, 
  Download, 
  ExternalLink, 
  Github, 
  Play, 
  Heart, 
  Clock, 
  TrendingUp, 
  Zap, 
  Globe, 
  Database, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader,
  Settings,
  BookOpen,
  Tag,
  Users,
  Award,
  Activity
} from 'lucide-react';
import { useBackend, MCPListItem, WebMCPResult } from '../hooks/useBackend';
import { mockLocalMCPs } from '../data/mockMCPs';

interface ExploreViewProps {
  isDark: boolean;
  onTryInPlayground?: (mcp: MCPListItem | WebMCPResult) => void;
}

type SearchMode = 'local' | 'web';

interface SearchFilters {
  domain: string;
  tags: string;
  validated: boolean | null;
  sortBy: string;
  minConfidence: number;
  sources: string[];
}

export const ExploreView: React.FC<ExploreViewProps> = ({ isDark, onTryInPlayground }) => {
  const { getMCPs, searchWebMCPs, enhancedSearchMCPs, loading, error } = useBackend();
  
  // State management
  const [searchMode, setSearchMode] = useState<SearchMode>('local');
  const [searchQuery, setSearchQuery] = useState('');
  const [localMCPs, setLocalMCPs] = useState<MCPListItem[]>([]);
  const [webMCPs, setWebMCPs] = useState<WebMCPResult[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    domain: 'all',
    tags: '',
    validated: null,
    sortBy: 'popularity',
    minConfidence: 0.0,
    sources: ['github', 'web', 'awesome']
  });

  // Load initial data and setup
  useEffect(() => {
    loadLocalMCPs();
    loadFavorites();
    loadRecentlyViewed();
  }, []);

  // Search suggestions based on query
  useEffect(() => {
    if (searchQuery.length > 1) {
      generateSearchSuggestions(searchQuery);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

  const loadLocalMCPs = async () => {
    setLocalLoading(true);
    try {
      console.log('🔍 Loading local MCPs from mock data...');
      // Use the mock data directly
      setLocalMCPs(mockLocalMCPs);
      console.log(`✅ Loaded ${mockLocalMCPs.length} local MCPs`);
    } catch (err) {
      console.error('❌ Failed to load local MCPs:', err);
    } finally {
      setLocalLoading(false);
    }
  };

  const performWebSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setDebugInfo(null);
    
    try {
      console.log('🌐 Starting web search for:', query);
      console.log('🔧 Search parameters:', {
        query,
        limit: 20,
        sources: filters.sources,
        minConfidence: filters.minConfidence,
        useWebScraping: true
      });

      const startTime = Date.now();
      
      // Use enhanced search with debugging
      const results = await enhancedSearchMCPs({
        query,
        limit: 20,
        sources: filters.sources,
        min_confidence: filters.minConfidence,
        use_web_scraping: true
      });
      
      const endTime = Date.now();
      const searchDuration = endTime - startTime;
      
      console.log(`✅ Web search completed in ${searchDuration}ms`);
      console.log(`📊 Found ${results.length} results`);
      
      // Set debug information
      setDebugInfo({
        query,
        duration: searchDuration,
        resultsCount: results.length,
        sources: filters.sources,
        minConfidence: filters.minConfidence,
        timestamp: new Date().toISOString()
      });
      
      setWebMCPs(results);
      
      if (results.length === 0) {
        setSearchError('No MCPs found for this search query. Try different keywords or check your filters.');
      }
      
    } catch (err) {
      console.error('❌ Web search failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Web search failed';
      setSearchError(errorMessage);
      setWebMCPs([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (searchMode === 'web') {
      await performWebSearch(searchQuery);
    } else {
      // Filter local MCPs based on search query
      if (searchQuery.trim()) {
        const filtered = mockLocalMCPs.filter(mcp => 
          mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mcp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mcp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setLocalMCPs(filtered);
      } else {
        setLocalMCPs(mockLocalMCPs);
      }
    }
  };

  const generateSearchSuggestions = (query: string) => {
    const commonSuggestions = [
      'weather api',
      'file system',
      'calendar events',
      'social media',
      'ecommerce store',
      'travel booking',
      'finance tracker',
      'ai assistant',
      'database manager',
      'search engine',
      'crypto trading',
      'smart home',
      'email automation',
      'image processing',
      'text analysis'
    ];

    const filtered = commonSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(suggestion.toLowerCase())
      )
      .slice(0, 5);

    setSearchSuggestions(filtered);
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('mcp_favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  };

  const loadRecentlyViewed = () => {
    const saved = localStorage.getItem('mcp_recently_viewed');
    if (saved) {
      setRecentlyViewed(JSON.parse(saved));
    }
  };

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
    localStorage.setItem('mcp_favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const addToRecentlyViewed = (id: string) => {
    const updated = [id, ...recentlyViewed.filter(item => item !== id)].slice(0, 10);
    setRecentlyViewed(updated);
    localStorage.setItem('mcp_recently_viewed', JSON.stringify(updated));
  };

  const handleTryInPlayground = (mcp: MCPListItem | WebMCPResult) => {
    addToRecentlyViewed('id' in mcp ? mcp.id : mcp.name);
    if (onTryInPlayground) {
      onTryInPlayground(mcp);
    }
  };

  const getDomainIcon = (domain: string) => {
    const icons: Record<string, any> = {
      weather: Globe,
      development: Database,
      ecommerce: Star,
      productivity: Zap,
      finance: TrendingUp,
      social: Users,
      travel: Globe,
      ai: Activity,
      general: Settings
    };
    return icons[domain] || Settings;
  };

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      weather: 'blue',
      development: 'green',
      ecommerce: 'purple',
      productivity: 'yellow',
      finance: 'orange',
      social: 'pink',
      travel: 'cyan',
      ai: 'indigo',
      general: 'gray'
    };
    return colors[domain] || 'gray';
  };

  const currentMCPs = searchMode === 'web' ? webMCPs : localMCPs;
  const isLoading = (searchMode === 'web' ? isSearching : localLoading) || loading;

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden">
      <div className="container mx-auto px-6 py-8 h-full overflow-y-auto">
        {/* Header */}
        <motion.div 
          className={`mb-8 p-8 rounded-3xl backdrop-blur-xl border ${
            isDark 
              ? 'bg-gray-800/30 border-gray-700/50' 
              : 'bg-white/30 border-white/50'
          } shadow-2xl`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <motion.div
                className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Search className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className={`text-4xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Explore MCPs
              </h1>
            </div>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Discover Model Context Protocols with enhanced search
            </p>
          </div>

          {/* Search Mode Toggle */}
          <div className={`flex justify-center mb-6`}>
            <div className={`flex rounded-2xl p-2 ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
            } backdrop-blur-sm`}>
              <motion.button
                onClick={() => setSearchMode('local')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  searchMode === 'local'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Database className="w-5 h-5" />
                <span>Local Library ({localMCPs.length})</span>
              </motion.button>
              <motion.button
                onClick={() => setSearchMode('web')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  searchMode === 'web'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : isDark
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Globe className="w-5 h-5" />
                <span>Web Search</span>
              </motion.button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder={searchMode === 'web' ? "Search web for MCPs..." : "Search local MCPs..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`w-full pl-12 pr-32 py-4 rounded-2xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    showFilters
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-50 text-blue-600'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Filter className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span>Search</span>
                </motion.button>
              </div>
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSuggestions && searchSuggestions.length > 0 && (
                <motion.div
                  className={`absolute top-full left-0 right-0 mt-2 rounded-xl border backdrop-blur-xl z-10 ${
                    isDark 
                      ? 'bg-gray-800/90 border-gray-700/50' 
                      : 'bg-white/90 border-gray-200/50'
                  } shadow-2xl`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="p-2">
                    {searchSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setShowSuggestions(false);
                          setTimeout(() => handleSearch(), 100);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          isDark 
                            ? 'text-gray-300 hover:bg-gray-700/50' 
                            : 'text-gray-700 hover:bg-gray-100/50'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center space-x-3">
                          <Search className="w-4 h-4 text-blue-500" />
                          <span>{suggestion}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Web Search Info */}
          {searchMode === 'web' && (
            <div className={`mt-4 p-4 rounded-xl ${
              isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50/50 border border-blue-200/50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  Enhanced Web Search: Find MCPs from GitHub, awesome lists, and the web
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.sources.includes('github')}
                    onChange={(e) => {
                      const newSources = e.target.checked 
                        ? [...filters.sources, 'github']
                        : filters.sources.filter(s => s !== 'github');
                      setFilters({...filters, sources: newSources});
                    }}
                    className="rounded"
                  />
                  <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>GitHub</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.sources.includes('web')}
                    onChange={(e) => {
                      const newSources = e.target.checked 
                        ? [...filters.sources, 'web']
                        : filters.sources.filter(s => s !== 'web');
                      setFilters({...filters, sources: newSources});
                    }}
                    className="rounded"
                  />
                  <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>General Web</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.sources.includes('awesome')}
                    onChange={(e) => {
                      const newSources = e.target.checked 
                        ? [...filters.sources, 'awesome']
                        : filters.sources.filter(s => s !== 'awesome');
                      setFilters({...filters, sources: newSources});
                    }}
                    className="rounded"
                  />
                  <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>Awesome Lists</span>
                </label>
              </div>
            </div>
          )}
        </motion.div>

        {/* Debug Information */}
        {debugInfo && (
          <motion.div
            className={`mb-6 p-4 rounded-xl ${
              isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-100/50 border border-gray-200/50'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                Search Debug Info
              </span>
            </div>
            <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <p><strong>Query:</strong> "{debugInfo.query}"</p>
              <p><strong>Duration:</strong> {debugInfo.duration}ms</p>
              <p><strong>Results:</strong> {debugInfo.resultsCount} MCPs found</p>
              <p><strong>Sources:</strong> {debugInfo.sources.join(', ')}</p>
              <p><strong>Min Confidence:</strong> {debugInfo.minConfidence}</p>
              <p><strong>Timestamp:</strong> {new Date(debugInfo.timestamp).toLocaleTimeString()}</p>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {(error || searchError) && (
          <motion.div
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-400 font-medium">Search Error</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error || searchError}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader className={`w-12 h-12 mx-auto mb-4 animate-spin ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {searchMode === 'web' ? 'Searching the web for MCPs...' : 'Loading local MCPs...'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchMode === 'web' ? 'This may take a few moments' : 'Please wait'}
            </p>
          </motion.div>
        )}

        {/* Results Grid */}
        {!isLoading && currentMCPs.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {currentMCPs.map((mcp, index) => {
              const mcpId = 'id' in mcp ? mcp.id : mcp.name;
              const isFavorite = favorites.has(mcpId);
              const domain = mcp.domain || 'general';
              const DomainIcon = getDomainIcon(domain);
              const domainColor = getDomainColor(domain);

              return (
                <motion.div
                  key={mcpId}
                  className={`community-post-card p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    isDark 
                      ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/40' 
                      : 'border-gray-200/30 bg-white/20 hover:bg-white/40'
                  } backdrop-blur-sm hover:shadow-xl smooth-animation`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${domainColor}-500/20`}>
                        <DomainIcon className={`w-5 h-5 text-${domainColor}-500`} />
                      </div>
                      <div>
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {mcp.name}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {domain} • {mcp.source_platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {mcp.validated && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <motion.button
                        onClick={() => toggleFavorite(mcpId)}
                        className={`p-1 rounded-lg transition-colors ${
                          isFavorite
                            ? 'text-yellow-500'
                            : isDark
                              ? 'text-gray-400 hover:text-yellow-400'
                              : 'text-gray-500 hover:text-yellow-500'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </motion.button>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 line-clamp-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {mcp.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {mcp.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className={`px-2 py-1 text-xs rounded-full ${
                          isDark 
                            ? 'bg-gray-600/50 text-gray-300' 
                            : 'bg-gray-100/50 text-gray-600'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                    {mcp.tags.length > 3 && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isDark ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-100/50 text-gray-600'
                      }`}>
                        +{mcp.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {Math.round(mcp.confidence_score * 100)}%
                        </span>
                      </div>
                      {'stars' in mcp && mcp.stars && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {mcp.stars}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDark 
                        ? `bg-${domainColor}-500/20 text-${domainColor}-400` 
                        : `bg-${domainColor}-100 text-${domainColor}-700`
                    }`}>
                      {mcp.file_type}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => handleTryInPlayground(mcp)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-4 h-4" />
                      <span>Try in Playground</span>
                    </motion.button>
                    {mcp.source_url && (
                      <motion.a
                        href={mcp.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-xl border transition-all duration-300 ${
                          isDark 
                            ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                            : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {mcp.source_platform === 'github' ? (
                          <Github className="w-4 h-4" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                      </motion.a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* No Results */}
        {!isLoading && currentMCPs.length === 0 && !error && !searchError && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Search className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No MCPs found
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              {searchMode === 'web' 
                ? 'Try different search terms or check your internet connection'
                : 'Try adjusting your search or filters'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};