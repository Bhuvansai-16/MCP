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
  BookmarkPlus,
  Bookmark,
  Clock,
  TrendingUp,
  Heart,
  Save,
  BarChart3,
  Sparkles,
  ThumbsUp,
  FileText,
  Settings,
  Sliders,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { useBackend, WebMCPResult, MCPListItem } from '../hooks/useBackend';

interface ExploreViewProps {
  isDark: boolean;
  onTryInPlayground: (mcp: MCPListItem | WebMCPResult) => void;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    domain: string;
    sortBy: string;
    verified: boolean | null;
    tags: string[];
  };
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('popularity');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [selectedMCP, setSelectedMCP] = useState<MCPListItem | WebMCPResult | null>(null);
  const [localMCPs, setLocalMCPs] = useState<MCPListItem[]>([]);
  const [webMCPs, setWebMCPs] = useState<WebMCPResult[]>([]);
  const [searchMode, setSearchMode] = useState<'local' | 'web'>('local');
  const [isSearching, setIsSearching] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [useWebScraping, setUseWebScraping] = useState(true);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [showSaveSearchDialog, setShowSaveSearchDialog] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [recentlyViewed, setRecentlyViewed] = useState<(MCPListItem | WebMCPResult)[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [programmingLanguage, setProgrammingLanguage] = useState('all');
  const [minPopularity, setMinPopularity] = useState(0);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [compareItems, setCompareItems] = useState<(MCPListItem | WebMCPResult)[]>([]);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [showTagCloud, setShowTagCloud] = useState(true);
  const [showRecommended, setShowRecommended] = useState(true);
  const [accentColor, setAccentColor] = useState('blue');
  const [hoveredMCP, setHoveredMCP] = useState<string | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const domains = ['all', 'travel', 'finance', 'development', 'productivity', 'data', 'weather', 'ecommerce', 'social', 'ai', 'communication'];
  const programmingLanguages = ['all', 'typescript', 'javascript', 'python', 'go', 'rust', 'java'];
  const popularTags = ['weather', 'api', 'finance', 'productivity', 'social', 'travel', 'ecommerce', 'calendar', 'files', 'search'];
  const accentColors = ['blue', 'purple', 'green', 'pink', 'orange', 'cyan'];

  // Check backend connectivity on component mount
  useEffect(() => {
    checkBackendConnection();
    
    // Load saved searches from localStorage
    const savedSearchesData = localStorage.getItem('savedSearches');
    if (savedSearchesData) {
      setSavedSearches(JSON.parse(savedSearchesData));
    }
    
    // Load favorites from localStorage
    const favoritesData = localStorage.getItem('favoriteMCPs');
    if (favoritesData) {
      setFavoriteIds(new Set(JSON.parse(favoritesData)));
    }
    
    // Load recently viewed from localStorage
    const recentlyViewedData = localStorage.getItem('recentlyViewedMCPs');
    if (recentlyViewedData) {
      setRecentlyViewed(JSON.parse(recentlyViewedData));
    }
    
    // Load custom order from localStorage
    const customOrderData = localStorage.getItem('customMCPOrder');
    if (customOrderData) {
      setCustomOrder(JSON.parse(customOrderData));
    }
    
    // Load user preferences
    const accentColorPref = localStorage.getItem('accentColor');
    if (accentColorPref) {
      setAccentColor(accentColorPref);
    }
  }, []);

  // Load local MCPs when filters change and backend is connected
  useEffect(() => {
    if (backendStatus === 'connected') {
      loadLocalMCPs();
    }
  }, [selectedDomain, sortBy, showVerifiedOnly, selectedTags, minPopularity, programmingLanguage, backendStatus]);

  // Generate search suggestions based on query
  useEffect(() => {
    if (searchQuery.length > 1) {
      // Generate AI-like suggestions based on query
      const generateSuggestions = () => {
        const allMCPs = [...localMCPs, ...webMCPs];
        const allTags = allMCPs.flatMap(mcp => mcp.tags);
        const allDomains = allMCPs.map(mcp => mcp.domain);
        
        // Combine with popular searches
        const suggestions = [
          `${searchQuery} api`,
          `${searchQuery} integration`,
          `${searchQuery} tools`,
          ...allTags.filter(tag => tag.includes(searchQuery)).map(tag => `#${tag}`),
          ...allDomains.filter(domain => domain.includes(searchQuery)).map(domain => `domain:${domain}`)
        ];
        
        // Return unique suggestions
        return [...new Set(suggestions)].slice(0, 5);
      };
      
      setSearchSuggestions(generateSuggestions());
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, localMCPs, webMCPs]);

  // Save favorites to localStorage when changed
  useEffect(() => {
    localStorage.setItem('favoriteMCPs', JSON.stringify(Array.from(favoriteIds)));
  }, [favoriteIds]);

  // Save recently viewed to localStorage when changed
  useEffect(() => {
    localStorage.setItem('recentlyViewedMCPs', JSON.stringify(recentlyViewed.slice(0, 10)));
  }, [recentlyViewed]);

  // Save custom order to localStorage when changed
  useEffect(() => {
    if (customOrder.length > 0) {
      localStorage.setItem('customMCPOrder', JSON.stringify(customOrder));
    }
  }, [customOrder]);

  // Save saved searches to localStorage when changed
  useEffect(() => {
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
  }, [savedSearches]);

  // Save accent color preference
  useEffect(() => {
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

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
      if (showVerifiedOnly) params.validated = true;
      if (minPopularity > 0) params.min_popularity = minPopularity;
      params.limit = 50;
      params.min_confidence = 0.0;

      console.log('Loading local MCPs with params:', params);
      const mcps = await getMCPs(params);
      console.log('Loaded local MCPs:', mcps);
      
      // Filter by selected tags if any
      let filteredMCPs = mcps;
      if (selectedTags.length > 0) {
        filteredMCPs = mcps.filter(mcp => 
          selectedTags.some(tag => mcp.tags.includes(tag))
        );
      }
      
      // Filter by programming language if selected
      if (programmingLanguage !== 'all') {
        filteredMCPs = filteredMCPs.filter(mcp => 
          mcp.file_type === programmingLanguage
        );
      }
      
      // Apply custom order if available
      if (customOrder.length > 0 && !isReordering) {
        const orderedMCPs: MCPListItem[] = [];
        const unorderedMCPs: MCPListItem[] = [];
        
        filteredMCPs.forEach(mcp => {
          const orderIndex = customOrder.indexOf(mcp.id);
          if (orderIndex !== -1) {
            orderedMCPs[orderIndex] = mcp;
          } else {
            unorderedMCPs.push(mcp);
          }
        });
        
        // Combine ordered and unordered MCPs
        filteredMCPs = [...orderedMCPs.filter(Boolean), ...unorderedMCPs];
      }
      
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

  const handleSaveSearch = () => {
    if (!savedSearchName.trim()) return;
    
    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: savedSearchName,
      query: searchQuery,
      filters: {
        domain: selectedDomain,
        sortBy,
        verified: showVerifiedOnly,
        tags: selectedTags
      }
    };
    
    setSavedSearches([...savedSearches, newSavedSearch]);
    setSavedSearchName('');
    setShowSaveSearchDialog(false);
  };

  const handleApplySavedSearch = (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.query);
    setSelectedDomain(savedSearch.filters.domain);
    setSortBy(savedSearch.filters.sortBy);
    setShowVerifiedOnly(savedSearch.filters.verified || false);
    setSelectedTags(savedSearch.filters.tags);
    setShowSavedSearches(false);
    
    // Trigger search
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleDeleteSavedSearch = (id: string) => {
    setSavedSearches(savedSearches.filter(search => search.id !== id));
  };

  const toggleFavorite = (mcp: MCPListItem | WebMCPResult) => {
    const id = 'id' in mcp ? mcp.id : mcp.source_url;
    const newFavorites = new Set(favoriteIds);
    
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    
    setFavoriteIds(newFavorites);
  };

  const isFavorite = (mcp: MCPListItem | WebMCPResult) => {
    const id = 'id' in mcp ? mcp.id : mcp.source_url;
    return favoriteIds.has(id);
  };

  const handleViewMCP = (mcp: MCPListItem | WebMCPResult) => {
    setSelectedMCP(mcp);
    
    // Add to recently viewed
    const id = 'id' in mcp ? mcp.id : mcp.source_url;
    const newRecentlyViewed = [
      mcp,
      ...recentlyViewed.filter(item => {
        const itemId = 'id' in item ? item.id : item.source_url;
        return itemId !== id;
      })
    ].slice(0, 10);
    
    setRecentlyViewed(newRecentlyViewed);
  };

  const toggleCompareItem = (mcp: MCPListItem | WebMCPResult) => {
    const id = 'id' in mcp ? mcp.id : mcp.source_url;
    
    if (compareItems.some(item => {
      const itemId = 'id' in item ? item.id : item.source_url;
      return itemId === id;
    })) {
      // Remove from compare
      setCompareItems(compareItems.filter(item => {
        const itemId = 'id' in item ? item.id : item.source_url;
        return itemId !== id;
      }));
    } else {
      // Add to compare (max 3)
      if (compareItems.length < 3) {
        setCompareItems([...compareItems, mcp]);
      }
    }
  };

  const isInCompare = (mcp: MCPListItem | WebMCPResult) => {
    const id = 'id' in mcp ? mcp.id : mcp.source_url;
    return compareItems.some(item => {
      const itemId = 'id' in item ? item.id : item.source_url;
      return itemId === id;
    });
  };

  const handleDragStart = (id: string) => {
    setDraggedItemId(id);
    setIsReordering(true);
  };

  const handleDragOver = (id: string) => {
    if (!draggedItemId || draggedItemId === id) return;
    
    // Reorder the custom order
    const newOrder = [...customOrder];
    const draggedIndex = newOrder.indexOf(draggedItemId);
    const targetIndex = newOrder.indexOf(id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItemId);
      setCustomOrder(newOrder);
    } else if (draggedIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.push(draggedItemId);
      setCustomOrder(newOrder);
    } else if (targetIndex !== -1) {
      newOrder.splice(targetIndex, 0, draggedItemId);
      setCustomOrder(newOrder);
    } else {
      newOrder.push(draggedItemId);
      newOrder.push(id);
      setCustomOrder(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setTimeout(() => {
      setIsReordering(false);
    }, 300);
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSearchSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const displayMCPs = searchMode === 'local' ? localMCPs : webMCPs;
  
  // Get recommended MCPs based on user behavior
  const getRecommendedMCPs = () => {
    if (recentlyViewed.length === 0) return [];
    
    // Get domains and tags from recently viewed
    const recentDomains = recentlyViewed.map(mcp => mcp.domain);
    const recentTags = recentlyViewed.flatMap(mcp => mcp.tags);
    
    // Find MCPs with similar domains or tags
    return displayMCPs
      .filter(mcp => 
        recentDomains.includes(mcp.domain) || 
        mcp.tags.some(tag => recentTags.includes(tag))
      )
      .filter(mcp => {
        // Exclude items that are already in recently viewed
        const mcpId = 'id' in mcp ? mcp.id : mcp.source_url;
        return !recentlyViewed.some(item => {
          const itemId = 'id' in item ? item.id : item.source_url;
          return itemId === mcpId;
        });
      })
      .slice(0, 4);
  };

  // Get all tags from MCPs for tag cloud
  const getAllTags = () => {
    const tags = displayMCPs.flatMap(mcp => mcp.tags);
    const tagCounts = tags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));
  };

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
                isDark ? `bg-${accentColor}-500/10 border border-${accentColor}-500/20` : `bg-${accentColor}-50/50 border border-${accentColor}-200/50`
              } backdrop-blur-sm`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-3">
                <Loader className={`w-5 h-5 animate-spin text-${accentColor}-500`} />
                <span className={`${isDark ? `text-${accentColor}-400` : `text-${accentColor}-700`}`}>
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
                ? `bg-gray-800/30 border-gray-700/50` 
                : `bg-white/30 border-white/50`
            } shadow-2xl`}>
              <div className="text-center mb-6">
                <h1 className={`text-4xl font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Explore MCPs
                </h1>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Discover Model Context Protocols with enhanced search
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
                        ? `bg-${accentColor}-500 text-white shadow-lg`
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
                        ? `bg-${accentColor}-500 text-white shadow-lg`
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
              <div className="relative max-w-2xl mx-auto mb-4">
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className={`w-full pl-12 pr-20 py-4 rounded-2xl border-2 transition-all duration-300 ${
                    isDark 
                      ? `bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-${accentColor}-500` 
                      : `bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-${accentColor}-500`
                  } focus:ring-2 focus:ring-${accentColor}-500/20 backdrop-blur-sm`}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                  <motion.button
                    onClick={() => setShowSavedSearches(!showSavedSearches)}
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      isDark 
                        ? `bg-gray-700/50 hover:bg-gray-600/50 text-gray-300` 
                        : `bg-gray-100/50 hover:bg-gray-200/50 text-gray-600`
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={handleSearch}
                    disabled={isSearching || backendStatus !== 'connected'}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      isSearching || backendStatus !== 'connected'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : searchMode === 'local'
                          ? `bg-${accentColor}-500 hover:bg-${accentColor}-600`
                          : `bg-${accentColor}-500 hover:bg-${accentColor}-600`
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

                {/* Search Suggestions */}
                <AnimatePresence>
                  {searchSuggestions.length > 0 && (
                    <motion.div
                      className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-lg z-10 ${
                        isDark 
                          ? 'bg-gray-800/90 border-gray-700/50' 
                          : 'bg-white/90 border-white/50'
                      } backdrop-blur-xl`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="p-2">
                        <div className="flex items-center px-3 py-2">
                          <Sparkles className={`w-4 h-4 mr-2 text-${accentColor}-500`} />
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Suggestions
                          </span>
                        </div>
                        {searchSuggestions.map((suggestion, index) => (
                          <motion.button
                            key={index}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                              isDark 
                                ? 'hover:bg-gray-700/50 text-gray-300' 
                                : 'hover:bg-gray-100/50 text-gray-700'
                            }`}
                            onClick={() => handleSearchSuggestionClick(suggestion)}
                            whileHover={{ x: 5 }}
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Saved Searches Dropdown */}
                <AnimatePresence>
                  {showSavedSearches && (
                    <motion.div
                      className={`absolute top-full right-0 mt-2 w-64 rounded-xl border shadow-lg z-10 ${
                        isDark 
                          ? 'bg-gray-800/90 border-gray-700/50' 
                          : 'bg-white/90 border-white/50'
                      } backdrop-blur-xl`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="p-2">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/20">
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Saved Searches
                          </span>
                          <motion.button
                            onClick={() => {
                              setShowSavedSearches(false);
                              setShowSaveSearchDialog(true);
                            }}
                            className={`p-1 rounded-lg transition-colors ${
                              isDark 
                                ? `text-${accentColor}-400 hover:bg-${accentColor}-500/10` 
                                : `text-${accentColor}-600 hover:bg-${accentColor}-50`
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Plus className="w-4 h-4" />
                          </motion.button>
                        </div>
                        
                        {savedSearches.length === 0 ? (
                          <div className="px-3 py-4 text-center">
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              No saved searches yet
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {savedSearches.map(search => (
                              <div
                                key={search.id}
                                className={`px-3 py-2 hover:bg-${accentColor}-500/10 rounded-lg transition-colors`}
                              >
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => handleApplySavedSearch(search)}
                                    className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} hover:underline`}
                                  >
                                    {search.name}
                                  </button>
                                  <motion.button
                                    onClick={() => handleDeleteSavedSearch(search.id)}
                                    className={`p-1 rounded-lg transition-colors ${
                                      isDark 
                                        ? 'text-red-400 hover:bg-red-500/10' 
                                        : 'text-red-600 hover:bg-red-50'
                                    }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </motion.button>
                                </div>
                                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {search.query || '(no query)'} • {search.filters.domain} • {search.filters.tags.length > 0 ? search.filters.tags.join(', ') : 'all tags'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Save Search Dialog */}
              <AnimatePresence>
                {showSaveSearchDialog && (
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                      onClick={() => setShowSaveSearchDialog(false)}
                    />
                    <motion.div
                      className={`relative w-full max-w-md rounded-3xl backdrop-blur-xl border ${
                        isDark 
                          ? 'bg-gray-800/90 border-gray-700/50' 
                          : 'bg-white/90 border-white/50'
                      } shadow-2xl`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Save Current Search
                          </h3>
                          <button
                            onClick={() => setShowSaveSearchDialog(false)}
                            className={`p-2 rounded-xl transition-colors ${
                              isDark 
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Search Name
                            </label>
                            <input
                              type="text"
                              value={savedSearchName}
                              onChange={(e) => setSavedSearchName(e.target.value)}
                              placeholder="e.g., My Weather MCPs"
                              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                                isDark 
                                  ? `bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-${accentColor}-500` 
                                  : `bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-${accentColor}-500`
                              } focus:ring-2 focus:ring-${accentColor}-500/20 backdrop-blur-sm`}
                            />
                          </div>
                          
                          <div className={`p-4 rounded-xl ${
                            isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                          }`}>
                            <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Search Parameters
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                <strong>Query:</strong> {searchQuery || '(none)'}
                              </p>
                              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                <strong>Domain:</strong> {selectedDomain}
                              </p>
                              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                <strong>Sort:</strong> {sortBy}
                              </p>
                              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                <strong>Verified Only:</strong> {showVerifiedOnly ? 'Yes' : 'No'}
                              </p>
                              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                <strong>Tags:</strong> {selectedTags.length > 0 ? selectedTags.join(', ') : '(none)'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-2">
                            <button
                              onClick={() => setShowSaveSearchDialog(false)}
                              className={`px-4 py-2 rounded-xl transition-colors ${
                                isDark 
                                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600'
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveSearch}
                              disabled={!savedSearchName.trim()}
                              className={`px-4 py-2 rounded-xl transition-colors ${
                                !savedSearchName.trim()
                                  ? 'bg-gray-400 cursor-not-allowed text-white'
                                  : `bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white`
                              }`}
                            >
                              Save Search
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {searchMode === 'web' && (
                <div className={`mt-4 p-4 rounded-xl ${
                  isDark ? `bg-${accentColor}-500/10 border border-${accentColor}-500/20` : `bg-${accentColor}-50/50 border border-${accentColor}-200/50`
                }`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${isDark ? `text-${accentColor}-400` : `text-${accentColor}-700`}`}>
                      🌐 <strong>Enhanced Web Search:</strong> Find MCPs from GitHub, GitLab, HuggingFace, and general web using BeautifulSoup4 scraping.
                    </p>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={useWebScraping}
                        onChange={(e) => setUseWebScraping(e.target.checked)}
                        className="rounded"
                      />
                      <span className={`text-sm ${isDark ? `text-${accentColor}-400` : `text-${accentColor}-700`}`}>
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
              className="mb-8 space-y-4"
              variants={itemVariants}
            >
              {/* Basic Filters */}
              <div className={`p-6 rounded-2xl backdrop-blur-xl border ${
                isDark 
                  ? 'bg-gray-800/30 border-gray-700/50' 
                  : 'bg-white/30 border-white/50'
              } shadow-xl`}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Filter className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Filters & Sorting
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                        isDark 
                          ? `bg-${accentColor}-500/20 hover:bg-${accentColor}-500/30 text-${accentColor}-400 border border-${accentColor}-500/30` 
                          : `bg-${accentColor}-50 hover:bg-${accentColor}-100 text-${accentColor}-600 border border-${accentColor}-200`
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                      <span>{showAdvancedFilters ? 'Hide Advanced' : 'Advanced Filters'}</span>
                      {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => setIsReordering(!isReordering)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                        isReordering
                          ? isDark
                            ? `bg-${accentColor}-500/20 text-${accentColor}-400 border border-${accentColor}-500/30`
                            : `bg-${accentColor}-50 text-${accentColor}-600 border border-${accentColor}-200`
                          : isDark 
                            ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                            : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                      }`}
                    >
                      {isReordering ? (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Order</span>
                        </>
                      ) : (
                        <>
                          <Settings className="w-4 h-4" />
                          <span>Reorder Cards</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Domain
                    </label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? `bg-gray-900/50 border-gray-600 text-white focus:border-${accentColor}-500` 
                          : `bg-white/50 border-gray-200 text-gray-900 focus:border-${accentColor}-500`
                      } focus:ring-2 focus:ring-${accentColor}-500/20 backdrop-blur-sm`}
                    >
                      {domains.map(domain => (
                        <option key={domain} value={domain}>
                          {domain === 'all' ? 'All Domains' : domain.charAt(0).toUpperCase() + domain.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? `bg-gray-900/50 border-gray-600 text-white focus:border-${accentColor}-500` 
                          : `bg-white/50 border-gray-200 text-gray-900 focus:border-${accentColor}-500`
                      } focus:ring-2 focus:ring-${accentColor}-500/20 backdrop-blur-sm`}
                    >
                      <option value="popularity">Popularity</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="created_at">Newest First</option>
                      <option value="confidence_score">Confidence Score</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className={`flex items-center space-x-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={showVerifiedOnly}
                        onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                        className={`rounded border-gray-300 text-${accentColor}-600 focus:ring-${accentColor}-500`}
                      />
                      <span className="text-sm font-medium">Verified MCPs Only</span>
                    </label>
                  </div>
                </div>
                
                {/* Advanced Filters */}
                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-gray-200/20"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Programming Language
                          </label>
                          <select
                            value={programmingLanguage}
                            onChange={(e) => setProgrammingLanguage(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                              isDark 
                                ? `bg-gray-900/50 border-gray-600 text-white focus:border-${accentColor}-500` 
                                : `bg-white/50 border-gray-200 text-gray-900 focus:border-${accentColor}-500`
                            } focus:ring-2 focus:ring-${accentColor}-500/20 backdrop-blur-sm`}
                          >
                            {programmingLanguages.map(lang => (
                              <option key={lang} value={lang}>
                                {lang === 'all' ? 'All Languages' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Minimum Popularity
                          </label>
                          <div className="flex items-center space-x-4">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={minPopularity}
                              onChange={(e) => setMinPopularity(parseInt(e.target.value))}
                              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                isDark ? 'bg-gray-700' : 'bg-gray-200'
                              }`}
                              style={{
                                backgroundImage: `linear-gradient(to right, ${isDark ? '#6366f1' : '#4f46e5'} 0%, ${isDark ? '#6366f1' : '#4f46e5'} ${minPopularity}%, ${isDark ? '#374151' : '#e5e7eb'} ${minPopularity}%, ${isDark ? '#374151' : '#e5e7eb'} 100%)`
                              }}
                            />
                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {minPopularity}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Accent Color
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {accentColors.map(color => (
                              <button
                                key={color}
                                onClick={() => setAccentColor(color)}
                                className={`w-8 h-8 rounded-full transition-all duration-300 ${
                                  accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 transform scale-110' : ''
                                }`}
                                style={{ backgroundColor: `var(--tw-${color}-500)` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Filter by Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {popularTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => handleTagClick(tag)}
                              className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                                selectedTags.includes(tag)
                                  ? isDark
                                    ? `bg-${accentColor}-500 text-white`
                                    : `bg-${accentColor}-500 text-white`
                                  : isDark
                                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                    : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-4">
                        <label className={`flex items-center space-x-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={showTagCloud}
                            onChange={(e) => setShowTagCloud(e.target.checked)}
                            className={`rounded border-gray-300 text-${accentColor}-600 focus:ring-${accentColor}-500`}
                          />
                          <span className="text-sm font-medium">Show Tag Cloud</span>
                        </label>
                        
                        <label className={`flex items-center space-x-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={showRecommended}
                            onChange={(e) => setShowRecommended(e.target.checked)}
                            className={`rounded border-gray-300 text-${accentColor}-600 focus:ring-${accentColor}-500`}
                          />
                          <span className="text-sm font-medium">Show Recommendations</span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                isDark ? `bg-${accentColor}-500/10 text-${accentColor}-400` : `bg-${accentColor}-50 text-${accentColor}-700`
              }`}>
                <Globe className="w-4 h-4" />
                <span>Found {webMCPs.length} MCPs from the web using {useWebScraping ? 'enhanced scraping' : 'API search'}</span>
              </div>
            </motion.div>
          )}

          {/* Tag Cloud */}
          {showTagCloud && searchMode === 'local' && displayMCPs.length > 0 && (
            <motion.div 
              className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border ${
                isDark 
                  ? 'bg-gray-800/30 border-gray-700/50' 
                  : 'bg-white/30 border-white/50'
              } shadow-xl`}
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Tag className={`w-5 h-5 text-${accentColor}-500`} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Popular Tags
                </h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {getAllTags().map(({ tag, count }) => (
                  <motion.button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                      selectedTags.includes(tag)
                        ? isDark
                          ? `bg-${accentColor}-500 text-white`
                          : `bg-${accentColor}-500 text-white`
                        : isDark
                          ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                          : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      fontSize: `${Math.max(0.75, Math.min(1.2, 0.8 + count / 20))}rem`
                    }}
                  >
                    {tag}
                    <span className={`ml-1 text-xs ${
                      selectedTags.includes(tag)
                        ? 'text-white/70'
                        : isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && searchMode === 'local' && (
            <motion.div 
              className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border ${
                isDark 
                  ? 'bg-gray-800/30 border-gray-700/50' 
                  : 'bg-white/30 border-white/50'
              } shadow-xl`}
              variants={itemVariants}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className={`w-5 h-5 text-${accentColor}-500`} />
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Recently Viewed
                  </h3>
                </div>
                <button
                  onClick={() => setRecentlyViewed([])}
                  className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Clear
                </button>
              </div>
              
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {recentlyViewed.slice(0, 5).map((mcp, index) => {
                  const id = 'id' in mcp ? mcp.id : mcp.source_url;
                  return (
                    <motion.div
                      key={id}
                      className={`flex-shrink-0 w-64 p-4 rounded-xl ${
                        isDark 
                          ? 'bg-gray-700/30 hover:bg-gray-700/50' 
                          : 'bg-white/30 hover:bg-white/50'
                      } backdrop-blur-sm border border-gray-200/20 cursor-pointer transition-all duration-300`}
                      whileHover={{ y: -5 }}
                      onClick={() => handleViewMCP(mcp)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {mcp.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {mcp.validated && (
                            <Shield className="w-3 h-3 text-green-500" />
                          )}
                          {'file_type' in mcp && (
                            <Code className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                      <p className={`text-xs line-clamp-2 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {mcp.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs">
                          <Globe className="w-3 h-3" />
                          <span>{mcp.domain}</span>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTryInPlayground(mcp);
                          }}
                          className={`p-1 rounded-lg ${
                            isDark 
                              ? `bg-${accentColor}-500/20 text-${accentColor}-400` 
                              : `bg-${accentColor}-50 text-${accentColor}-600`
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Play className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Recommended MCPs */}
          {showRecommended && getRecommendedMCPs().length > 0 && searchMode === 'local' && (
            <motion.div 
              className={`mb-8 p-6 rounded-2xl backdrop-blur-xl border ${
                isDark 
                  ? 'bg-gray-800/30 border-gray-700/50' 
                  : 'bg-white/30 border-white/50'
              } shadow-xl`}
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className={`w-5 h-5 text-${accentColor}-500`} />
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Recommended For You
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {getRecommendedMCPs().map((mcp, index) => {
                  const id = 'id' in mcp ? mcp.id : mcp.source_url;
                  return (
                    <motion.div
                      key={id}
                      className={`p-4 rounded-xl ${
                        isDark 
                          ? 'bg-gray-700/30 hover:bg-gray-700/50' 
                          : 'bg-white/30 hover:bg-white/50'
                      } backdrop-blur-sm border border-gray-200/20 cursor-pointer transition-all duration-300`}
                      whileHover={{ y: -5 }}
                      onClick={() => handleViewMCP(mcp)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {mcp.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {mcp.validated && (
                            <Shield className="w-3 h-3 text-green-500" />
                          )}
                          {'file_type' in mcp && (
                            <Code className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                      <p className={`text-xs line-clamp-2 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {mcp.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs">
                          <Globe className="w-3 h-3" />
                          <span>{mcp.domain}</span>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTryInPlayground(mcp);
                          }}
                          className={`p-1 rounded-lg ${
                            isDark 
                              ? `bg-${accentColor}-500/20 text-${accentColor}-400` 
                              : `bg-${accentColor}-50 text-${accentColor}-600`
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Play className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Compare Panel */}
          <AnimatePresence>
            {showComparePanel && compareItems.length > 0 && (
              <motion.div 
                className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 p-6 rounded-2xl backdrop-blur-xl border z-20 ${
                  isDark 
                    ? 'bg-gray-800/90 border-gray-700/50' 
                    : 'bg-white/90 border-white/50'
                } shadow-2xl`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                style={{ width: 'calc(100% - 4rem)', maxWidth: '1200px' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className={`w-5 h-5 text-${accentColor}-500`} />
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Compare MCPs ({compareItems.length}/3)
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCompareItems([])}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        isDark 
                          ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                          : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600'
                      }`}
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowComparePanel(false)}
                      className={`p-2 rounded-lg ${
                        isDark 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {compareItems.map((mcp, index) => {
                    const id = 'id' in mcp ? mcp.id : mcp.source_url;
                    return (
                      <div
                        key={id}
                        className={`p-4 rounded-xl ${
                          isDark 
                            ? 'bg-gray-700/50' 
                            : 'bg-gray-100/50'
                        } backdrop-blur-sm`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {mcp.name}
                          </h4>
                          <button
                            onClick={() => toggleCompareItem(mcp)}
                            className={`p-1 rounded-lg ${
                              isDark 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className={`text-sm line-clamp-2 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {mcp.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {mcp.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className={`px-2 py-1 text-xs rounded-full ${
                                isDark 
                                  ? 'bg-gray-600/50 text-gray-300' 
                                  : 'bg-gray-200/50 text-gray-600'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-sm">
                            <Globe className="w-4 h-4" />
                            <span>{mcp.domain}</span>
                          </div>
                          <motion.button
                            onClick={() => onTryInPlayground(mcp)}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
                              isDark 
                                ? `bg-${accentColor}-500/20 text-${accentColor}-400` 
                                : `bg-${accentColor}-50 text-${accentColor}-600`
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-3 h-3" />
                            <span>Try</span>
                          </motion.button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {compareItems.length < 3 && (
                    <div
                      className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-center ${
                        isDark 
                          ? 'border-gray-600/50 text-gray-400' 
                          : 'border-gray-300/50 text-gray-500'
                      }`}
                    >
                      <p className="text-center text-sm">
                        Add another MCP<br />to compare
                      </p>
                    </div>
                  )}
                </div>
                
                {compareItems.length >= 2 && (
                  <div className="mt-4 flex justify-center">
                    <motion.button
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium ${
                        isDark 
                          ? `bg-${accentColor}-500 hover:bg-${accentColor}-600` 
                          : `bg-${accentColor}-500 hover:bg-${accentColor}-600`
                      } text-white shadow-lg`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span>Compare Selected MCPs</span>
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
                className={`px-6 py-3 bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white rounded-xl font-medium transition-all duration-300`}
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
                const id = isWebResult ? mcp.source_url : mcp.id;
                const isFav = isFavorite(mcp);
                const isComparing = isInCompare(mcp);
                
                return (
                  <motion.div
                    key={id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`relative p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
                      isDark 
                        ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50' 
                        : 'bg-white/30 border-white/50 hover:bg-white/50'
                    } shadow-xl hover:shadow-2xl`}
                    onClick={() => handleViewMCP(mcp)}
                    onMouseEnter={() => {
                      setHoveredMCP(id);
                      setShowQuickView(true);
                    }}
                    onMouseLeave={() => {
                      setHoveredMCP(null);
                      setShowQuickView(false);
                    }}
                    draggable={isReordering}
                    onDragStart={() => handleDragStart(id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver(id);
                    }}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex space-x-1">
                      {mcp.validated && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDark 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Verified
                        </div>
                      )}
                      
                      {'popularity' in mcp && mcp.popularity > 90 && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDark 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          Trending
                        </div>
                      )}
                      
                      {'created_at' in mcp && new Date(mcp.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDark 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          New
                        </div>
                      )}
                    </div>

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
                              ? `bg-${accentColor}-500/20 text-${accentColor}-400` 
                              : `bg-${accentColor}-100 text-${accentColor}-700`
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
                        className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-${accentColor}-500 to-${accentColor === 'blue' ? 'purple' : accentColor}-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTryInPlayground(mcp);
                        }}
                      >
                        <Play className="w-4 h-4" />
                        <span>Try in Playground</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-2 rounded-xl border transition-all duration-300 ${
                          isFav
                            ? isDark
                              ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
                              : 'bg-yellow-50 border-yellow-200 text-yellow-600'
                            : isDark 
                              ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                              : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(mcp);
                        }}
                      >
                        {isFav ? (
                          <Bookmark className="w-4 h-4 fill-current" />
                        ) : (
                          <BookmarkPlus className="w-4 h-4" />
                        )}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-2 rounded-xl border transition-all duration-300 ${
                          isComparing
                            ? isDark
                              ? `bg-${accentColor}-500/20 border-${accentColor}-500/30 text-${accentColor}-400`
                              : `bg-${accentColor}-50 border-${accentColor}-200 text-${accentColor}-600`
                            : isDark 
                              ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                              : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareItem(mcp);
                          if (!isComparing && compareItems.length === 0) {
                            setShowComparePanel(true);
                          }
                        }}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </motion.button>
                      
                      {isWebResult && (
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
                      )}
                    </div>

                    {/* Quick View Panel */}
                    <AnimatePresence>
                      {showQuickView && hoveredMCP === id && (
                        <motion.div
                          className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-xl z-10 ${
                            isDark 
                              ? 'bg-gray-800/95 border border-gray-700/50' 
                              : 'bg-white/95 border border-white/50'
                          } backdrop-blur-xl shadow-2xl`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Description
                              </h4>
                              <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {mcp.description}
                              </p>
                            </div>
                            
                            {'schema' in mcp && mcp.schema && (
                              <div>
                                <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  Available Tools
                                </h4>
                                <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {Array.isArray(mcp.schema.tools) ? (
                                    mcp.schema.tools.map((tool: any, i: number) => (
                                      <li key={i} className="flex items-center space-x-1">
                                        <Zap className="w-3 h-3 text-yellow-500" />
                                        <span>{tool.name}</span>
                                      </li>
                                    ))
                                  ) : (
                                    <li>No tools information available</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {isWebResult ? 'Web Source' : 'Last Updated'}: {isWebResult ? mcp.source_platform : new Date('created_at' in mcp ? mcp.created_at : Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-2 py-1 rounded-lg text-xs ${
                                    isDark 
                                      ? `bg-${accentColor}-500/20 text-${accentColor}-400` 
                                      : `bg-${accentColor}-50 text-${accentColor}-600`
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTryInPlayground(mcp);
                                  }}
                                >
                                  <Play className="w-3 h-3 inline mr-1" />
                                  Try Now
                                </motion.button>
                                
                                {isWebResult && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-2 py-1 rounded-lg text-xs ${
                                      isDark 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-green-50 text-green-600'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImportFromWeb(mcp as WebMCPResult);
                                    }}
                                  >
                                    <Download className="w-3 h-3 inline mr-1" />
                                    Import
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

          {/* Compare Button */}
          <AnimatePresence>
            {compareItems.length > 0 && !showComparePanel && (
              <motion.div
                className="fixed bottom-8 right-8 z-20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <motion.button
                  onClick={() => setShowComparePanel(true)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-full ${
                    isDark 
                      ? `bg-${accentColor}-500 hover:bg-${accentColor}-600` 
                      : `bg-${accentColor}-500 hover:bg-${accentColor}-600`
                  } text-white shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Compare ({compareItems.length})</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

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
                          <motion.button
                            onClick={() => toggleFavorite(selectedMCP)}
                            className={`p-1 rounded-lg transition-colors`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {isFavorite(selectedMCP) ? (
                              <Bookmark className={`w-6 h-6 text-yellow-500 fill-current`} />
                            ) : (
                              <BookmarkPlus className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
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
                                  ? `bg-${accentColor}-500/20 text-${accentColor}-400` 
                                  : `bg-${accentColor}-100 text-${accentColor}-700`
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
                        <p className={`text-lg font-bold ${isDark ? `text-${accentColor}-400` : `text-${accentColor}-600`}`}>
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
                            <div className="flex items-center space-x-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className={`bg-${accentColor}-500 h-2.5 rounded-full`} style={{ width: `${selectedMCP.popularity}%` }}></div>
                              </div>
                              <p className={`text-lg font-bold ${isDark ? `text-${accentColor}-400` : `text-${accentColor}-600`}`}>
                                {selectedMCP.popularity}%
                              </p>
                            </div>
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

                    {/* Usage Stats */}
                    <div className={`p-6 rounded-xl mb-8 ${
                      isDark ? 'bg-gray-700/30' : 'bg-gray-100/30'
                    }`}>
                      <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Usage Statistics
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-3">
                          <Users className={`w-5 h-5 text-${accentColor}-500`} />
                          <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Active Users
                            </p>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {Math.floor(Math.random() * 500) + 100}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Clock className={`w-5 h-5 text-${accentColor}-500`} />
                          <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Last Used
                            </p>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {new Date(Date.now() - Math.floor(Math.random() * 86400000)).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <ThumbsUp className={`w-5 h-5 text-${accentColor}-500`} />
                          <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Rating
                            </p>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {(Math.floor(Math.random() * 20) + 80) / 10}/10
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FileText className={`w-5 h-5 text-${accentColor}-500`} />
                          <div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Format
                            </p>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {selectedMCP.file_type.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>
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
                        className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-${accentColor}-500 to-${accentColor === 'blue' ? 'purple' : accentColor}-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg`}
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
                          onClick={() => {
                            handleImportFromWeb(selectedMCP as WebMCPResult);
                            setSelectedMCP(null);
                          }}
                        >
                          <Download className="w-5 h-5" />
                          <span>Import MCP</span>
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all duration-300 ${
                            isInCompare(selectedMCP)
                              ? isDark
                                ? `bg-${accentColor}-500/20 border-${accentColor}-500/30 text-${accentColor}-400`
                                : `bg-${accentColor}-50 border-${accentColor}-200 text-${accentColor}-600`
                              : isDark 
                                ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                                : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                          }`}
                          onClick={() => {
                            toggleCompareItem(selectedMCP);
                            if (!isInCompare(selectedMCP) && compareItems.length === 0) {
                              setShowComparePanel(true);
                            }
                          }}
                        >
                          <BarChart3 className="w-5 h-5" />
                          <span>{isInCompare(selectedMCP) ? 'Remove from Compare' : 'Add to Compare'}</span>
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