import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  Share2, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Tag, 
  Image, 
  Link, 
  Send, 
  Play,
  ChevronDown,
  ChevronUp,
  Clock,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  User,
  FileText,
  CheckCircle
} from 'lucide-react';
import { MCPListItem, WebMCPResult } from '../data/mockMCPs';

interface CommunityViewProps {
  isDark: boolean;
  user: any;
  onTryInPlayground?: (mcp: MCPListItem | WebMCPResult) => void;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  timestamp: Date;
  likes: number;
  comments: number;
  tags: string[];
  mcp?: {
    name: string;
    description: string;
    tools: string[];
  };
  liked: boolean;
  bookmarked: boolean;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ isDark, user, onTryInPlayground }) => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      title: 'Advanced Weather MCP with Real-Time Radar',
      content: 'Just released a new version of my weather MCP that includes real-time radar data and precipitation forecasting. It uses a combination of multiple weather APIs to provide the most accurate data possible.',
      author: {
        name: 'Alex Chen',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        verified: true,
      },
      timestamp: new Date(Date.now() - 3600000 * 2),
      likes: 42,
      comments: 7,
      tags: ['weather', 'api', 'radar'],
      mcp: {
        name: 'weather.radar',
        description: 'Advanced weather forecasting with radar visualization',
        tools: ['get_current_weather', 'get_radar_data', 'get_precipitation_forecast']
      },
      liked: false,
      bookmarked: true
    },
    {
      id: '2',
      title: 'E-commerce MCP for Small Businesses',
      content: 'I built this MCP to help small businesses integrate e-commerce functionality into their applications without having to deal with complex payment gateways directly. It handles product management, cart functionality, and checkout process.',
      author: {
        name: 'Sarah Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        verified: true,
      },
      timestamp: new Date(Date.now() - 3600000 * 8),
      likes: 38,
      comments: 12,
      tags: ['ecommerce', 'payments', 'products'],
      mcp: {
        name: 'ecommerce.lite',
        description: 'Simplified e-commerce tools for small businesses',
        tools: ['manage_products', 'process_cart', 'handle_checkout']
      },
      liked: true,
      bookmarked: false
    },
    {
      id: '3',
      title: 'Looking for feedback on my Calendar MCP',
      content: 'I\'ve been working on a calendar management MCP that integrates with Google Calendar, Outlook, and Apple Calendar. Would love some feedback on the API design and additional features that might be useful.',
      author: {
        name: 'Michael Wong',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
        verified: false,
      },
      timestamp: new Date(Date.now() - 3600000 * 24),
      likes: 15,
      comments: 23,
      tags: ['calendar', 'feedback', 'integration'],
      mcp: {
        name: 'calendar.sync',
        description: 'Cross-platform calendar synchronization',
        tools: ['sync_events', 'create_event', 'manage_calendars']
      },
      liked: false,
      bookmarked: false
    }
  ]);
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    mcp: null as any
  });
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newLiked = !post.liked;
        return {
          ...post,
          liked: newLiked,
          likes: newLiked ? post.likes + 1 : post.likes - 1
        };
      }
      return post;
    }));
  };

  const toggleBookmark = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          bookmarked: !post.bookmarked
        };
      }
      return post;
    }));
  };

  const toggleExpandPost = (postId: string) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) return;
    
    const post: Post = {
      id: Date.now().toString(),
      title: newPost.title,
      content: newPost.content,
      author: {
        name: user?.name || 'Anonymous',
        avatar: user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anonymous',
        verified: true,
      },
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      tags: newPost.tags,
      mcp: newPost.mcp,
      liked: false,
      bookmarked: false
    };
    
    setPosts([post, ...posts]);
    setNewPost({
      title: '',
      content: '',
      tags: [],
      mcp: null
    });
    setShowCreatePost(false);
  };

  const addTag = (tag: string) => {
    if (tag && !newPost.tags.includes(tag)) {
      setNewPost({
        ...newPost,
        tags: [...newPost.tags, tag]
      });
    }
  };

  const removeTag = (tag: string) => {
    setNewPost({
      ...newPost,
      tags: newPost.tags.filter(t => t !== tag)
    });
  };

  const filteredPosts = posts.filter(post => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Tag filter
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => post.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  }).sort((a, b) => {
    if (sortBy === 'recent') {
      return b.timestamp.getTime() - a.timestamp.getTime();
    } else {
      return b.likes - a.likes;
    }
  });

  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)));

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
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
                className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Users className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className={`text-4xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Community
              </h1>
            </div>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Share your MCPs and connect with other developers
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
              />
            </div>

            {/* Filter Button */}
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                showFilters
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
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </motion.button>

            {/* Sort Button */}
            <motion.button
              onClick={() => setSortBy(sortBy === 'recent' ? 'popular' : 'recent')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
              } backdrop-blur-sm`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {sortBy === 'recent' ? (
                <>
                  <Clock className="w-5 h-5" />
                  <span>Recent</span>
                </>
              ) : (
                <>
                  <ThumbsUp className="w-5 h-5" />
                  <span>Popular</span>
                </>
              )}
            </motion.button>

            {/* Create Post Button */}
            <motion.button
              onClick={() => setShowCreatePost(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              <span>Create Post</span>
            </motion.button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 overflow-hidden"
              >
                <div className="p-4 rounded-xl border border-gray-200/20 bg-gray-100/20 dark:bg-gray-800/20">
                  <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Filter by Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                          selectedTags.includes(tag)
                            ? isDark
                              ? 'bg-purple-500 text-white'
                              : 'bg-purple-500 text-white'
                            : isDark
                              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                              : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Posts */}
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              className={`community-post-card p-6 rounded-2xl border-2 transition-all duration-300 ${
                isDark 
                  ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/40' 
                  : 'border-gray-200/30 bg-white/20 hover:bg-white/40'
              } backdrop-blur-sm hover:shadow-xl smooth-animation`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
            >
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full border-2 border-white/20"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {post.author.name}
                      </h3>
                      {post.author.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {formatTimestamp(post.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Post Title */}
              <h2 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {post.title}
              </h2>

              {/* Post Content */}
              <div className={`mb-4 ${
                expandedPost === post.id ? '' : 'line-clamp-3'
              }`}>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {post.content}
                </p>
              </div>

              {/* Expand/Collapse Button */}
              {post.content.length > 150 && (
                <button
                  onClick={() => toggleExpandPost(post.id)}
                  className={`flex items-center space-x-1 mb-4 text-sm ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{expandedPost === post.id ? 'Show less' : 'Read more'}</span>
                  {expandedPost === post.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs rounded-full ${
                      isDark 
                        ? 'bg-gray-600/50 text-gray-300' 
                        : 'bg-gray-100/50 text-gray-600'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* MCP Card */}
              {post.mcp && (
                <div className={`p-4 rounded-xl mb-4 ${
                  isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <h4 className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                        {post.mcp.name}
                      </h4>
                    </div>
                    {onTryInPlayground && (
                      <motion.button
                        onClick={() => {
                          // Create a mock MCP for the playground
                          const mockMCP: MCPListItem = {
                            id: post.id,
                            name: post.mcp!.name,
                            description: post.mcp!.description,
                            tags: post.tags,
                            domain: 'general',
                            validated: true,
                            popularity: post.likes,
                            source_platform: 'community',
                            confidence_score: 0.9,
                            file_type: 'json',
                            stars: post.likes,
                            created_at: post.timestamp.toISOString()
                          };
                          onTryInPlayground(mockMCP);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs bg-white text-blue-600 shadow-sm dark:bg-blue-600 dark:text-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-3 h-3" />
                        <span>Try</span>
                      </motion.button>
                    )}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                    {post.mcp.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.mcp.tools.map((tool, index) => (
                      <span
                        key={index}
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          isDark 
                            ? 'bg-blue-500/20 text-blue-300' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center space-x-1 ${
                      post.liked
                        ? 'text-red-500'
                        : isDark
                          ? 'text-gray-400 hover:text-red-400'
                          : 'text-gray-600 hover:text-red-500'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </motion.button>
                  <button
                    className={`flex items-center space-x-1 ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => toggleBookmark(post.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.bookmarked
                        ? 'text-blue-500'
                        : isDark
                          ? 'text-gray-400 hover:text-blue-400'
                          : 'text-gray-600 hover:text-blue-500'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Bookmark className={`w-5 h-5 ${post.bookmarked ? 'fill-current' : ''}`} />
                  </motion.button>
                  <motion.button
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                No posts found
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                {searchQuery || selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to create a post!'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreatePost && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCreatePost(false)}
            />
            
            <motion.div
              className={`relative w-full max-w-lg rounded-2xl backdrop-blur-xl border shadow-2xl ${
                isDark 
                  ? 'bg-gray-800/90 border-gray-700/50' 
                  : 'bg-white/90 border-white/50'
              } overflow-y-auto max-h-[90vh]`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Create New Post
                  </h3>
                  <button
                    onClick={() => setShowCreatePost(false)}
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
                  {/* Post Type */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Post Type
                    </label>
                    <select
                      className={`w-full px-4 py-2 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-gray-900/50 border-gray-600 text-white' 
                          : 'bg-white/50 border-gray-200 text-gray-900'
                      } backdrop-blur-sm`}
                    >
                      <option value="discussion">Discussion</option>
                      <option value="mcp-share">Share MCP</option>
                      <option value="question">Question</option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      placeholder="Enter post title..."
                      className={`w-full px-4 py-2 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                          : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                      } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Content
                    </label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      placeholder="Describe your MCP, implementation, or start a discussion..."
                      rows={5}
                      className={`w-full px-4 py-2 rounded-xl border transition-all duration-300 ${
                        isDark 
                          ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                          : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                      } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm resize-none`}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tags
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Tag className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <input
                          type="text"
                          placeholder="Add a tag..."
                          className={`w-full pl-10 pr-4 py-2 rounded-xl border transition-all duration-300 ${
                            isDark 
                              ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                              : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                          } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              addTag(input.value);
                              input.value = '';
                            }
                          }}
                        />
                      </div>
                      <motion.button
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add a tag..."]') as HTMLInputElement;
                          if (input && input.value) {
                            addTag(input.value);
                            input.value = '';
                          }
                        }}
                        className={`px-3 py-2 rounded-xl transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                            : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                        } backdrop-blur-sm`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Add
                      </motion.button>
                    </div>
                    {newPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newPost.tags.map((tag, index) => (
                          <div
                            key={index}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                              isDark 
                                ? 'bg-gray-700/50 text-gray-300' 
                                : 'bg-gray-100/50 text-gray-600'
                            }`}
                          >
                            <span>#{tag}</span>
                            <button
                              onClick={() => removeTag(tag)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <motion.button
                      onClick={() => setShowCreatePost(false)}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                        isDark 
                          ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                          : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                      } backdrop-blur-sm`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleCreatePost}
                      disabled={!newPost.title || !newPost.content}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        newPost.title && newPost.content
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                          : isDark
                            ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-200/30 text-gray-400 cursor-not-allowed'
                      }`}
                      whileHover={newPost.title && newPost.content ? { scale: 1.05 } : {}}
                      whileTap={newPost.title && newPost.content ? { scale: 0.95 } : {}}
                    >
                      <Send className="w-4 h-4" />
                      <span>Publish Post</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};