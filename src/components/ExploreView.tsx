import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Heart,
  Clock,
  ThumbsUp,
  Bookmark,
  Share2,
  Info,
  ArrowUpDown,
  Sliders,
  Save,
  Sparkles
} from 'lucide-react';
import { useBackend, WebMCPResult, MCPListItem } from '../hooks/useBackend';

interface ExploreViewProps {
  isDark: boolean;
  onTryInPlayground?: (mcp: MCPListItem | WebMCPResult) => void;
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
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [savedSearches, setSavedSearches] = useState<{id: string, name: string, query: string, filters: any}[]>([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTagCloud, setShowTagCloud] = useState(true);
  const [recommendedMCPs, setRecommendedMCPs] = useState<(MCPListItem | WebMCPResult)[]>([]);
  const [hoveredMCP, setHoveredMCP] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const domains = ['all', 'travel', 'finance', 'development', 'productivity', 'data', 'weather', 'ecommerce', 'social', 'ai', 'communication'];
  const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'PHP'];
  const popularTags = ['api', 'weather', 'database', 'ai', 'tools', 'automation', 'search', 'social', 'finance', 'productivity'];

  // Check backend connectivity on component mount
  useEffect(() => {
    checkBackendConnection();
    
    // Load saved searches from localStorage
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteMCPs');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
    
    // Load recently viewed from localStorage
    const savedRecent = localStorage.getItem('recentlyViewedMCPs');
    if (savedRecent) {
      setRecentlyViewed(JSON.parse(savedRecent));
    }
    
    // Generate search suggestions based on popular searches
    generateSearchSuggestions('');
    
    // Generate recommended MCPs
    generateRecommendations();
    
    return () => {
      // Clean up any resources
    };
  }, []);

  // Save favorites to localStorage when changed
  useEffect(() => {
    localStorage.setItem('favoriteMCPs', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Save recently viewed to localStorage when changed
  useEffect(() => {
    localStorage.setItem('recentlyViewedMCPs', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Save saved searches to localStorage when changed
  useEffect(() => {
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  // Generate search suggestions based on query
  const generateSearchSuggestions = (query: string) => {
    if (!query) {
      setSearchSuggestions([
        'weather forecast api',
        'e-commerce tools',
        'social media automation',
        'calendar management',
        'finance tracker'
      ]);
      return;
    }
    
    // Generate AI-like suggestions based on query
    const suggestions = [];
    
    if (query.includes('weather')) {
      suggestions.push('weather forecast api', 'weather alerts system', 'weather data visualization');
    } else if (query.includes('shop') || query.includes('commerce')) {
      suggestions.push('e-commerce product search', 'shopping cart api', 'inventory management');
    } else if (query.includes('social')) {
      suggestions.push('social media posting', 'social analytics', 'social engagement tools');
    } else if (query.includes('calendar') || query.includes('schedule')) {
      suggestions.push('calendar management', 'meeting scheduler', 'appointment booking');
    } else if (query.includes('finance') || query.includes('money')) {
      suggestions.push('finance tracker', 'budget management', 'expense categorization');
    } else {
      // Generic suggestions based on partial matches
      const allSuggestions = [
        'weather forecast api',
        'e-commerce tools',
        'social media automation',
        'calendar management',
        'finance tracker',
        'database operations',
        'file system tools',
        'search engine api',
        'travel booking system',
        'ai assistant tools'
      ];
      
      suggestions.push(
        ...allSuggestions.filter(s => 
          s.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
    
    setSearchSuggestions(suggestions.slice(0, 5));
  };

  const checkBackendConnection = async () => {
    setBackendStatus('checking');
    try {
      console.log('Checking backend connection to:', BACKEND_URL);
      const healthData = await healthCheck();
      console.log('Backend health check response:', healthData);
      
      if (healthData.status === 'healthy') {
        setBackendStatus('connected');
        console.log('Backend connection successful');
        
        // Show scraping capabilities
        if (healthData.scraping_enabled) {
          console.log(`Web scraping enabled for: ${healthData.supported_platforms.join(', ')}`);
        }
      } else {
        throw new Error('Backend health check failed');
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('error');
      
      if (retryCount < 3) {
        const delay = 2000 * (retryCount + 1); // Exponential backoff
        console.log(`Backend connection failed. Retrying in ${delay/1000}s...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkBackendConnection();
        }, delay);
      } else {
        console.error('Failed to connect to backend after multiple attempts.');
      }
    }
  };

  const loadLocalMCPs = async () => {
    try {
      const params: any = {};
      if (selectedDomain !== 'all') params.domain = selectedDomain;
      if (sortBy) params.sort_by = sortBy;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      if (minRating > 0) params.min_rating = minRating;
      params.limit = 50;
      params.min_confidence = 0.0;

      console.log('Loading local MCPs with params:', params);
      const mcps = await getMCPs(params);
      console.log('Loaded local MCPs:', mcps);
      
      // Filter by favorites if needed
      const filteredMCPs = showFavoritesOnly 
        ? mcps.filter(mcp => favorites.has(mcp.id))
        : mcps;
        
      setLocalMCPs(filteredMCPs);
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
        console.log(`Found ${filtered.length} local MCPs matching "${searchQuery}"`);
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
        console.log(`Found ${results.length} MCPs from the web using ${useWebScraping ? 'enhanced scraping' : 'API search'}`);
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
      console.log(`Successfully imported ${result.name}!`);
      
      // Refresh local MCPs to show the newly imported one
      loadLocalMCPs();
      
      // Switch to local mode to see the imported MCP
      setSearchMode('local');
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleSelectMCP = (mcp: MCPListItem | WebMCPResult) => {
    setSelectedMCP(mcp);
    
    // Add to recently viewed
    const mcpId = 'id' in mcp ? mcp.id : mcp.source_url;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== mcpId);
      return [mcpId, ...filtered].slice(0, 10);
    });
  };

  const toggleFavorite = (mcp: MCPListItem | WebMCPResult) => {
    const mcpId = 'id' in mcp ? mcp.id : mcp.source_url;
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(mcpId)) {
      newFavorites.delete(mcpId);
    } else {
      newFavorites.add(mcpId);
    }
    
    setFavorites(newFavorites);
  };

  const isFavorite = (mcp: MCPListItem | WebMCPResult) => {
    const mcpId = 'id' in mcp ? mcp.id : mcp.source_url;
    return favorites.has(mcpId);
  };

  const toggleCompare = (mcp: MCPListItem | WebMCPResult) => {
    const mcpId = 'id' in mcp ? mcp.id : mcp.source_url;
    
    if (compareList.includes(mcpId)) {
      setCompareList(compareList.filter(id => id !== mcpId));
    } else {
      if (compareList.length < 3) {
        setCompareList([...compareList, mcpId]);
      } else {
        console.log('Maximum 3 MCPs can be compared at once');
      }
    }
  };

  const isInCompareList = (mcp: MCPListItem | WebMCPResult) => {
    const mcpId = 'id' in mcp ? mcp.id : mcp.source_url;
    return compareList.includes(mcpId);
  };

  const saveCurrentSearch = () => {
    const newSearch = {
      id: `search_${Date.now()}`,
      name: searchQuery || 'Unnamed Search',
      query: searchQuery,
      filters: {
        domain: selectedDomain,
        tags: selectedTags,
        languages: selectedLanguages,
        minRating,
        showFavoritesOnly
      }
    };
    
    setSavedSearches([...savedSearches, newSearch]);
  };

  const applySavedSearch = (search: any) => {
    setSearchQuery(search.query);
    setSelectedDomain(search.filters.domain || 'all');
    setSelectedTags(search.filters.tags || []);
    setSelectedLanguages(search.filters.languages || []);
    setMinRating(search.filters.minRating || 0);
    setShowFavoritesOnly(search.filters.showFavoritesOnly || false);
    
    // Close the saved searches panel
    setShowSavedSearches(false);
    
    // Execute search
    setTimeout(handleSearch, 100);
  };

  const deleteSavedSearch = (id: string) => {
    setSavedSearches(savedSearches.filter(search => search.id !== id));
  };

  const generateRecommendations = () => {
    // In a real app, this would use user history and preferences
    // For now, we'll just use a mix of popular and recently viewed
    const recommended = localMCPs
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 3);
      
    setRecommendedMCPs(recommended);
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

  // Load MCPs when filters change and backend is connected
  useEffect(() => {
    if (backendStatus === 'connected') {
      loadLocalMCPs();
    }
  }, [selectedDomain, sortBy, selectedTags, minRating, showFavoritesOnly, backendStatus]);

  // Update search suggestions when query changes
  useEffect(() => {
    generateSearchSuggestions(searchQuery);
  }, [searchQuery]);

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden">
      <div className="container mx-auto px-6 py-8 h-full overflow-y-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-h-full"
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
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchMode === 'local' 
                    ? "🔍 Search local MCPs (e.g., weather, airbnb)" 
                    : "🌐 Search web for MCPs with enhanced scraping (e.g., airbnb.bookings, weather API)"
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    generateSearchSuggestions(e.target.value);
                  }}
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

                {/* Search Suggestions */}
                {searchSuggestions.length > 0 && searchQuery && (
                  <div className={`absolute left-0 right-0 mt-2 rounded-xl border shadow-lg z-10 ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className={`w-full text-left px-4 py-3 ${index !== 0 ? 'border-t' : ''} ${
                          index === searchSuggestions.length - 1 ? 'rounded-b-xl' : ''
                        } ${index === 0 ? 'rounded-t-xl' : ''} transition-colors ${
                          isDark 
                            ? 'border-gray-700 hover:bg-gray-700 text-gray-300' 
                            : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                        }`}
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setSearchSuggestions([]);
                          if (searchInputRef.current) {
                            searchInputRef.current.focus();
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <Search className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <motion.button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                    showAdvancedFilters
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDark
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
                        : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                  } backdrop-blur-sm`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sliders className="w-4 h-4" />
                  <span>{showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}</span>
                </motion.button>

                <motion.button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                    showFavoritesOnly
                      ? isDark
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                      : isDark
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
                        : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                  } backdrop-blur-sm`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  <span>Favorites</span>
                </motion.button>

                <motion.button
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                    showSavedSearches
                      ? isDark
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-green-50 text-green-600 border border-green-200'
                      : isDark
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
                        : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                  } backdrop-blur-sm`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bookmark className={`w-4 h-4 ${showSavedSearches ? 'fill-current' : ''}`} />
                  <span>Saved Searches</span>
                </motion.button>

                {compareList.length > 0 && (
                  <motion.button
                    onClick={() => setShowComparePanel(!showComparePanel)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                      showComparePanel
                        ? isDark
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-purple-50 text-purple-600 border border-purple-200'
                        : isDark
                          ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
                          : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                    } backdrop-blur-sm`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Compare ({compareList.length})</span>
                  </motion.button>
                )}

                <motion.button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                    isDark
                      ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
                      : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                  } backdrop-blur-sm`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>{viewMode === 'grid' ? 'List View' : 'Grid View'}</span>
                </motion.button>

                {searchQuery && (
                  <motion.button
                    onClick={saveCurrentSearch}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                      isDark
                        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
                        : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                    } backdrop-blur-sm`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Search</span>
                  </motion.button>
                )}
              </div>

              {/* Advanced Filters Panel */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                    } backdrop-blur-sm`}>
                      <h3 className={`text-sm font-semibold mb-3 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Advanced Filters
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className={`block text-xs font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Domain
                          </label>
                          <select
                            value={selectedDomain}
                            onChange={(e) => setSelectedDomain(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg text-sm border transition-all duration-300 ${
                              isDark 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-900'
                            }`}
                          >
                            {domains.map(domain => (
                              <option key={domain} value={domain}>
                                {domain === 'all' ? 'All Domains' : domain.charAt(0).toUpperCase() + domain.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className={`block text-xs font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Minimum Rating
                          </label>
                          <select
                            value={minRating}
                            onChange={(e) => setMinRating(Number(e.target.value))}
                            className={`w-full px-3 py-2 rounded-lg text-sm border transition-all duration-300 ${
                              isDark 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-900'
                            }`}
                          >
                            <option value={0}>Any Rating</option>
                            <option value={3}>3+ Stars</option>
                            <option value={4}>4+ Stars</option>
                            <option value={4.5}>4.5+ Stars</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className={`block text-xs font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Sort By
                          </label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg text-sm border transition-all duration-300 ${
                              isDark 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-900'
                            }`}
                          >
                            <option value="popularity">Popularity</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="created_at">Newest First</option>
                            <option value="confidence_score">Confidence Score</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Filter by Tags
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {popularTags.map(tag => (
                              <button
                                key={tag}
                                onClick={() => {
                                  if (selectedTags.includes(tag)) {
                                    setSelectedTags(selectedTags.filter(t => t !== tag));
                                  } else {
                                    setSelectedTags([...selectedTags, tag]);
                                  }
                                }}
                                className={`px-2 py-1 rounded-full text-xs transition-all duration-300 ${
                                  selectedTags.includes(tag)
                                    ? isDark
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-blue-500 text-white'
                                    : isDark
                                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className={`block text-xs font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Programming Language
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {languages.slice(0, 6).map(lang => (
                              <button
                                key={lang}
                                onClick={() => {
                                  if (selectedLanguages.includes(lang)) {
                                    setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                                  } else {
                                    setSelectedLanguages([...selectedLanguages, lang]);
                                  }
                                }}
                                className={`px-2 py-1 rounded-full text-xs transition-all duration-300 ${
                                  selectedLanguages.includes(lang)
                                    ? isDark
                                      ? 'bg-green-500 text-white'
                                      : 'bg-green-500 text-white'
                                    : isDark
                                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Saved Searches Panel */}
              <AnimatePresence>
                {showSavedSearches && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                    }`}>
                      <h3 className={`text-sm font-semibold mb-3 ${
                        isDark ? 'text-green-400' : 'text-green-700'
                      }`}>
                        Saved Searches
                      </h3>
                      
                      {savedSearches.length === 0 ? (
                        <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                          No saved searches yet. Search for something and click "Save Search" to save it for later.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {savedSearches.map(search => (
                            <div 
                              key={search.id}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                isDark ? 'bg-gray-800/50' : 'bg-white/50'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <Bookmark className="w-4 h-4 text-green-500" />
                                <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {search.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => applySavedSearch(search)}
                                  className={`p-1 rounded-lg transition-colors ${
                                    isDark
                                      ? 'text-green-400 hover:bg-green-500/10'
                                      : 'text-green-600 hover:bg-green-50'
                                  }`}
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteSavedSearch(search.id)}
                                  className={`p-1 rounded-lg transition-colors ${
                                    isDark
                                      ? 'text-red-400 hover:bg-red-500/10'
                                      : 'text-red-600 hover:bg-red-50'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Compare Panel */}
              <AnimatePresence>
                {showComparePanel && compareList.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
                    }`}>
                      <h3 className={`text-sm font-semibold mb-3 ${
                        isDark ? 'text-purple-400' : 'text-purple-700'
                      }`}>
                        Compare MCPs ({compareList.length}/3)
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {compareList.map(mcpId => {
                          const mcp = [...localMCPs, ...webMCPs].find(m => 
                            ('id' in m ? m.id === mcpId : m.source_url === mcpId)
                          );
                          
                          if (!mcp) return null;
                          
                          return (
                            <div 
                              key={mcpId}
                              className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
                                isDark ? 'bg-gray-800/50' : 'bg-white/50'
                              }`}
                            >
                              <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {mcp.name}
                              </span>
                              <button
                                onClick={() => toggleCompare(mcp)}
                                className={`p-1 rounded-full transition-colors ${
                                  isDark
                                    ? 'text-red-400 hover:bg-red-500/10'
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex justify-end">
                        <motion.button
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                            isDark
                              ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye className="w-4 h-4" />
                          <span>Compare Selected</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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

          {/* Tag Cloud */}
          {showTagCloud && backendStatus === 'connected' && (
            <motion.div 
              className="mb-6"
              variants={itemVariants}
            >
              <div className={`p-4 rounded-2xl ${
                isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/30 border-white/50'
              } backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Popular Tags
                  </h3>
                  <button
                    onClick={() => setShowTagCloud(false)}
                    className={`p-1 rounded-lg transition-colors ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <motion.button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        handleSearch();
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                        isDark 
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        fontSize: `${Math.random() * 0.5 + 0.8}rem`
                      }}
                    >
                      #{tag}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recommended MCPs */}
          {recommendedMCPs.length > 0 && backendStatus === 'connected' && (
            <motion.div 
              className="mb-6"
              variants={itemVariants}
            >
              <div className={`p-4 rounded-2xl ${
                isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50/50 border-blue-200/50'
              } backdrop-blur-sm`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                    Recommended For You
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recommendedMCPs.map((mcp, index) => (
                    <motion.div
                      key={index}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        isDark 
                          ? 'bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50' 
                          : 'bg-white/50 hover:bg-white/70 border border-gray-200/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleSelectMCP(mcp)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {mcp.name}
                        </h4>
                        {'popularity' in mcp && (
                          <div className="flex items-center">
                            <ThumbsUp className="w-3 h-3 text-blue-500" />
                            <span className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {mcp.popularity}%
                            </span>
                          </div>
                        )}
                      </div>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {mcp.description.substring(0, 60)}...
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && backendStatus === 'connected' && (
            <motion.div 
              className="mb-6"
              variants={itemVariants}
            >
              <div className={`p-4 rounded-2xl ${
                isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/30 border-white/50'
              } backdrop-blur-sm`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Recently Viewed
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentlyViewed.slice(0, 5).map((mcpId, index) => {
                    const mcp = [...localMCPs, ...webMCPs].find(m => 
                      ('id' in m ? m.id === mcpId : m.source_url === mcpId)
                    );
                    
                    if (!mcp) return null;
                    
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleSelectMCP(mcp)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                            : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {mcp.name}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

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
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
              <motion.div 
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }
                variants={containerVariants}
              >
                {displayMCPs.map((mcp, index) => {
                  const isWebResult = 'file_type' in mcp;
                  const mcpId = isWebResult ? mcp.source_url : mcp.id;
                  const isFav = isFavorite(mcp);
                  const isComparing = isInCompareList(mcp);
                  const isHovered = hoveredMCP === mcpId;
                  
                  return (
                    <motion.div
                      key={mcpId}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`relative p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
                        isDark 
                          ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50' 
                          : 'bg-white/30 border-white/50 hover:bg-white/50'
                      } shadow-xl hover:shadow-2xl`}
                      onClick={() => handleSelectMCP(mcp)}
                      onMouseEnter={() => setHoveredMCP(mcpId)}
                      onMouseLeave={() => setHoveredMCP(null)}
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
                            {mcp.description.length > 100 
                              ? `${mcp.description.substring(0, 100)}...` 
                              : mcp.description}
                          </p>
                        </div>
                        
                        {/* Quick Action Buttons */}
                        <div className="flex flex-col space-y-2">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(mcp);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              isFav
                                ? 'text-yellow-500'
                                : isDark
                                  ? 'text-gray-400 hover:text-yellow-400'
                                  : 'text-gray-500 hover:text-yellow-500'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </motion.button>
                          
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompare(mcp);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              isComparing
                                ? 'text-purple-500'
                                : isDark
                                  ? 'text-gray-400 hover:text-purple-400'
                                  : 'text-gray-500 hover:text-purple-500'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Eye className={`w-4 h-4 ${isComparing ? 'fill-current' : ''}`} />
                          </motion.button>
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
                            if (onTryInPlayground) {
                              onTryInPlayground(mcp);
                            }
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
                              toggleCompare(mcp);
                            }}
                          >
                            {isComparing ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </motion.button>
                        )}
                      </div>

                      {/* Quick Preview Panel */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-xl z-10 shadow-xl ${
                              isDark 
                                ? 'bg-gray-800 border border-gray-700' 
                                : 'bg-white border border-gray-200'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Quick Preview
                              </h4>
                              <button
                                onClick={() => setHoveredMCP(null)}
                                className={`p-1 rounded-lg ${
                                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              <div>
                                <h5 className={`text-xs font-medium mb-1 ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Description
                                </h5>
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {mcp.description}
                                </p>
                              </div>
                              
                              <div>
                                <h5 className={`text-xs font-medium mb-1 ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  Tags
                                </h5>
                                <div className="flex flex-wrap gap-1">
                                  {mcp.tags.map((tag, i) => (
                                    <span
                                      key={i}
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        isDark 
                                          ? 'bg-blue-500/20 text-blue-400' 
                                          : 'bg-blue-100 text-blue-700'
                                      }`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              {'schema' in mcp && mcp.schema && (
                                <div>
                                  <h5 className={`text-xs font-medium mb-1 ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    Available Tools
                                  </h5>
                                  <div className="space-y-1">
                                    {mcp.schema.tools?.map((tool: any, i: number) => (
                                      <div
                                        key={i}
                                        className={`p-2 rounded-lg ${
                                          isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-1">
                                          <Zap className="w-3 h-3 text-blue-500" />
                                          <span className={`text-xs font-medium ${
                                            isDark ? 'text-white' : 'text-gray-900'
                                          }`}>
                                            {tool.name}
                                          </span>
                                        </div>
                                        {tool.description && (
                                          <p className={`text-xs mt-1 ${
                                            isDark ? 'text-gray-400' : 'text-gray-600'
                                          }`}>
                                            {tool.description}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-end pt-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg"
                                  onClick={() => {
                                    if (onTryInPlayground) {
                                      onTryInPlayground(mcp);
                                    }
                                  }}
                                >
                                  <Play className="w-3 h-3" />
                                  <span>Try in Playground</span>
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
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
                          <motion.button
                            onClick={() => toggleFavorite(selectedMCP)}
                            className={`p-1 rounded-lg transition-colors`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {isFavorite(selectedMCP) ? (
                              <Heart className="w-5 h-5 text-red-500 fill-current" />
                            ) : (
                              <Heart className="w-5 h-5 text-gray-400" />
                            )}
                          </motion.button>
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

                    {/* Usage Stats */}
                    <div className="mb-8">
                      <div className="flex items-center space-x-2 mb-4">
                        <Info className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Usage Statistics
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`p-4 rounded-xl ${
                          isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                        }`}>
                          <h5 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Active Users
                          </h5>
                          <p className={`text-xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {Math.floor(Math.random() * 500) + 100}
                          </p>
                        </div>
                        <div className={`p-4 rounded-xl ${
                          isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                        }`}>
                          <h5 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Downloads
                          </h5>
                          <p className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            {Math.floor(Math.random() * 5000) + 500}
                          </p>
                        </div>
                        <div className={`p-4 rounded-xl ${
                          isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                        }`}>
                          <h5 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Rating
                          </h5>
                          <div className="flex items-center">
                            <p className={`text-xl font-bold mr-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              {(Math.random() * 1.5 + 3.5).toFixed(1)}
                            </p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl ${
                          isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                        }`}>
                          <h5 className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Last Used
                          </h5>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {new Date(Date.now() - Math.random() * 86400000 * 7).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                        onClick={() => {
                          if (onTryInPlayground) {
                            onTryInPlayground(selectedMCP);
                            setSelectedMCP(null);
                          }
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
                            isInCompareList(selectedMCP)
                              ? isDark
                                ? 'border-purple-600 text-purple-400 hover:bg-purple-600/10'
                                : 'border-purple-500 text-purple-600 hover:bg-purple-50'
                              : isDark 
                                ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                                : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                          }`}
                          onClick={() => toggleCompare(selectedMCP)}
                        >
                          <Eye className="w-5 h-5" />
                          <span>{isInCompareList(selectedMCP) ? 'Remove from Compare' : 'Add to Compare'}</span>
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