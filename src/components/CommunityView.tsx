import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Star,
  Code,
  Github,
  ExternalLink,
  Filter,
  Search,
  TrendingUp,
  Clock,
  Award,
  Eye,
  Download,
  ThumbsUp,
  Send,
  MoreHorizontal,
  Flag,
  Edit,
  Trash2,
  Play,
  X
} from 'lucide-react';
import { MCPListItem, WebMCPResult } from '../data/mockMCPs';

interface CommunityViewProps {
  isDark: boolean;
  user: any;
  onTryInPlayground?: (mcp: MCPListItem | WebMCPResult) => void;
}

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    reputation: number;
  };
  title: string;
  content: string;
  type: 'mcp' | 'implementation' | 'discussion' | 'showcase';
  tags: string[];
  mcpSchema?: any;
  githubUrl?: string;
  demoUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  replies?: Comment[];
}

const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      id: 'user1',
      name: 'Alex Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      verified: true,
      reputation: 1250
    },
    title: 'Advanced Weather MCP with Real-time Alerts',
    content: 'Built a comprehensive weather MCP that includes real-time weather alerts, historical data analysis, and climate predictions. Features include severe weather notifications, air quality monitoring, and agricultural weather insights.',
    type: 'mcp',
    tags: ['weather', 'alerts', 'climate', 'agriculture'],
    mcpSchema: {
      name: 'weather.advanced',
      version: '2.1.0',
      tools: ['get_weather', 'get_alerts', 'get_forecast', 'get_air_quality']
    },
    githubUrl: 'https://github.com/alexchen/weather-mcp',
    demoUrl: 'https://weather-mcp-demo.vercel.app',
    likes: 142,
    comments: 23,
    shares: 18,
    bookmarks: 67,
    views: 1205,
    isLiked: false,
    isBookmarked: true,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: '2',
    author: {
      id: 'user2',
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      verified: false,
      reputation: 890
    },
    title: 'E-commerce MCP Implementation Guide',
    content: 'Step-by-step guide on implementing an e-commerce MCP with Shopify integration. Covers product search, cart management, order processing, and customer support automation.',
    type: 'implementation',
    tags: ['ecommerce', 'shopify', 'tutorial', 'automation'],
    githubUrl: 'https://github.com/sarahj/ecommerce-mcp-guide',
    likes: 89,
    comments: 15,
    shares: 12,
    bookmarks: 45,
    views: 756,
    isLiked: true,
    isBookmarked: false,
    createdAt: new Date('2024-01-14T14:20:00Z'),
    updatedAt: new Date('2024-01-14T14:20:00Z')
  },
  {
    id: '3',
    author: {
      id: 'user3',
      name: 'David Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
      verified: true,
      reputation: 2100
    },
    title: 'Best Practices for MCP Security',
    content: 'Discussion on security considerations when building MCPs. Topics include input validation, API key management, rate limiting, and secure data handling.',
    type: 'discussion',
    tags: ['security', 'best-practices', 'api', 'validation'],
    likes: 156,
    comments: 34,
    shares: 28,
    bookmarks: 89,
    views: 1890,
    isLiked: false,
    isBookmarked: true,
    createdAt: new Date('2024-01-13T09:15:00Z'),
    updatedAt: new Date('2024-01-13T09:15:00Z')
  },
  {
    id: '4',
    author: {
      id: 'user4',
      name: 'Maria Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
      verified: false,
      reputation: 650
    },
    title: 'AI-Powered Travel Assistant Showcase',
    content: 'Showcasing my AI travel assistant built with MCPs. Features include flight booking, hotel recommendations, itinerary planning, and local activity suggestions.',
    type: 'showcase',
    tags: ['travel', 'ai-assistant', 'booking', 'recommendations'],
    demoUrl: 'https://travel-assistant-demo.netlify.app',
    mcpSchema: {
      name: 'travel.assistant',
      version: '1.0.0',
      tools: ['search_flights', 'book_hotel', 'plan_itinerary', 'get_recommendations']
    },
    likes: 203,
    comments: 41,
    shares: 35,
    bookmarks: 112,
    views: 2340,
    isLiked: true,
    isBookmarked: true,
    createdAt: new Date('2024-01-12T16:45:00Z'),
    updatedAt: new Date('2024-01-12T16:45:00Z')
  }
];

export const CommunityView: React.FC<CommunityViewProps> = ({ isDark, user, onTryInPlayground }) => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mcp' | 'implementation' | 'discussion' | 'showcase'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Memoized filtered posts for better performance
  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => {
        if (filter !== 'all' && post.type !== filter) return false;
        if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !post.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'popular':
            return (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares);
          case 'trending':
            return b.views - a.views;
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [posts, filter, searchQuery, sortBy]);

  // Optimized handlers with useCallback
  const handleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  }, []);

  const handleBookmark = useCallback((postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isBookmarked: !post.isBookmarked,
            bookmarks: post.isBookmarked ? post.bookmarks - 1 : post.bookmarks + 1
          }
        : post
    ));
  }, []);

  const handleShare = useCallback((post: Post) => {
    const shareUrl = `${window.location.origin}/community/post/${post.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setPosts(prev => prev.map(p => 
        p.id === post.id ? { ...p, shares: p.shares + 1 } : p
      ));
    });
  }, []);

  const handleComment = useCallback((postId: string) => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        verified: user.verified || false
      },
      content: newComment,
      likes: 0,
      isLiked: false,
      createdAt: new Date()
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, comments: post.comments + 1 } : post
    ));
  }, [newComment, user]);

  const handleTryInPlayground = useCallback((post: Post) => {
    if (!onTryInPlayground || !post.mcpSchema) return;

    // Convert post MCP schema to the expected format
    const mockMCP: MCPListItem = {
      id: post.id,
      name: post.mcpSchema.name,
      description: post.content.substring(0, 200) + '...',
      tags: post.tags,
      domain: 'community',
      validated: true,
      popularity: Math.floor((post.likes + post.views) / 20),
      source_url: post.githubUrl,
      source_platform: 'community',
      confidence_score: 0.9,
      file_type: 'json',
      stars: post.likes,
      created_at: post.createdAt.toISOString()
    };

    onTryInPlayground(mockMCP);
  }, [onTryInPlayground]);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'mcp':
        return <Code className="w-4 h-4" />;
      case 'implementation':
        return <Github className="w-4 h-4" />;
      case 'discussion':
        return <MessageCircle className="w-4 h-4" />;
      case 'showcase':
        return <Star className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'mcp':
        return 'blue';
      case 'implementation':
        return 'green';
      case 'discussion':
        return 'purple';
      case 'showcase':
        return 'orange';
      default:
        return 'gray';
    }
  }, []);

  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }, []);

  return (
    <div className="community-container">
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <motion.div
                className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Users className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className={`text-4xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Community
                </h1>
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Share MCPs, implementations, and connect with developers
                </p>
              </div>
            </div>

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

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search posts, tags, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
              />
            </div>

            <div className="flex space-x-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white' 
                    : 'bg-white/50 border-gray-200 text-gray-900'
                } backdrop-blur-sm`}
              >
                <option value="all">All Posts</option>
                <option value="mcp">MCPs</option>
                <option value="implementation">Implementations</option>
                <option value="discussion">Discussions</option>
                <option value="showcase">Showcases</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white' 
                    : 'bg-white/50 border-gray-200 text-gray-900'
                } backdrop-blur-sm`}
              >
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Posts Grid - Optimized for performance */}
        <div className="space-y-6 overflow-y-auto virtual-scroll-container">
          {filteredPosts.map((post, index) => {
            const typeColor = getTypeColor(post.type);
            return (
              <motion.div
                key={post.id}
                className={`community-post-card p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
                  isDark 
                    ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50' 
                    : 'bg-white/30 border-white/50 hover:bg-white/50'
                } shadow-xl hover:shadow-2xl smooth-animation`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedPost(post)}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                      loading="lazy"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {post.author.name}
                        </h3>
                        {post.author.verified && (
                          <Award className="w-4 h-4 text-blue-500" />
                        )}
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {post.author.reputation} rep
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formatTimeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
                      isDark 
                        ? `bg-${typeColor}-500/20 text-${typeColor}-400` 
                        : `bg-${typeColor}-100 text-${typeColor}-700`
                    }`}>
                      {getTypeIcon(post.type)}
                      <span className="capitalize">{post.type}</span>
                    </span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {post.title}
                  </h2>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                    {post.content}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isDark 
                          ? 'bg-gray-700/50 text-gray-300' 
                          : 'bg-gray-100/50 text-gray-600'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Links */}
                {(post.githubUrl || post.demoUrl) && (
                  <div className="flex space-x-3 mb-4">
                    {post.githubUrl && (
                      <a
                        href={post.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                          isDark 
                            ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                            : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600'
                        }`}
                      >
                        <Github className="w-4 h-4" />
                        <span>Code</span>
                      </a>
                    )}
                    {post.demoUrl && (
                      <a
                        href={post.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                          isDark 
                            ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                            : 'bg-blue-100/50 hover:bg-blue-200/50 text-blue-600'
                        }`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Demo</span>
                
                      </a>
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200/20">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                      className={`flex items-center space-x-1 transition-colors ${
                        post.isLiked 
                          ? 'text-red-500' 
                          : isDark 
                            ? 'text-gray-400 hover:text-red-400' 
                            : 'text-gray-600 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPost(post);
                      }}
                      className={`flex items-center space-x-1 transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-blue-400' 
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.comments}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(post);
                      }}
                      className={`flex items-center space-x-1 transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-green-400' 
                          : 'text-gray-600 hover:text-green-600'
                      }`}
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.shares}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-1 text-sm ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <Eye className="w-4 h-4" />
                      <span>{post.views}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(post.id);
                      }}
                      className={`transition-colors ${
                        post.isBookmarked 
                          ? 'text-yellow-500' 
                          : isDark 
                            ? 'text-gray-400 hover:text-yellow-400' 
                            : 'text-gray-600 hover:text-yellow-600'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Try in Playground Button - Only show for MCP and showcase posts */}
                {(post.type === 'mcp' || post.type === 'showcase') && post.mcpSchema && onTryInPlayground && (
                  <div className="mt-4 pt-4 border-t border-gray-200/20">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTryInPlayground(post);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-4 h-4" />
                      <span>Try in Playground</span>
                    </motion.button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Post Detail Modal - Optimized */}
        <AnimatePresence>
          {selectedPost && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedPost(null)}
              />
              <motion.div
                className={`relative w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-3xl backdrop-blur-xl border ${
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
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <img
                        src={selectedPost.author.avatar}
                        alt={selectedPost.author.name}
                        className="w-12 h-12 rounded-full border-2 border-white/20"
                        loading="lazy"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {selectedPost.author.name}
                          </h3>
                          {selectedPost.author.verified && (
                            <Award className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatTimeAgo(selectedPost.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPost(null)}
                      className={`p-2 rounded-xl transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="mb-6">
                    <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedPost.title}
                    </h1>
                    <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedPost.content}
                    </p>
                  </div>

                  {/* Try in Playground Button - Only show for MCP and showcase posts */}
                  {(selectedPost.type === 'mcp' || selectedPost.type === 'showcase') && selectedPost.mcpSchema && onTryInPlayground && (
                    <div className="mb-6">
                      <motion.button
                        onClick={() => {
                          handleTryInPlayground(selectedPost);
                          setSelectedPost(null);
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-5 h-5" />
                        <span>Try in Playground</span>
                      </motion.button>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="border-t border-gray-200/20 pt-6">
                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Comments ({selectedPost.comments})
                    </h3>

                    {/* Add Comment */}
                    <div className="mb-6">
                      <div className="flex space-x-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border-2 border-white/20"
                          loading="lazy"
                        />
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className={`w-full px-4 py-3 rounded-xl border-2 resize-none transition-all duration-300 ${
                              isDark 
                                ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                                : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                            } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                            rows={3}
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleComment(selectedPost.id)}
                              disabled={!newComment.trim()}
                              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-4 h-4" />
                              <span>Comment</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.name}
                            className="w-10 h-10 rounded-full border-2 border-white/20"
                            loading="lazy"
                          />
                          <div className="flex-1">
                            <div className={`p-4 rounded-xl ${
                              isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                            }`}>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {comment.author.name}
                                </span>
                                {comment.author.verified && (
                                  <Award className="w-3 h-3 text-blue-500" />
                                )}
                                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {formatTimeAgo(comment.createdAt)}
                                </span>
                              </div>
                              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {comment.content}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                              <button
                                className={`flex items-center space-x-1 text-sm transition-colors ${
                                  comment.isLiked 
                                    ? 'text-red-500' 
                                    : isDark 
                                      ? 'text-gray-400 hover:text-red-400' 
                                      : 'text-gray-600 hover:text-red-600'
                                }`}
                              >
                                <ThumbsUp className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                                <span>{comment.likes}</span>
                              </button>
                              <button
                                className={`text-sm transition-colors ${
                                  isDark 
                                    ? 'text-gray-400 hover:text-blue-400' 
                                    : 'text-gray-600 hover:text-blue-600'
                                }`}
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl backdrop-blur-xl border ${
                  isDark 
                    ? 'bg-gray-800/90 border-gray-700/50' 
                    : 'bg-white/90 border-white/50'
                } shadow-2xl`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Create New Post
                    </h2>
                    <button
                      onClick={() => setShowCreatePost(false)}
                      className={`p-2 rounded-xl transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Post Type
                      </label>
                      <select
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-900/50 border-gray-600 text-white' 
                            : 'bg-white/50 border-gray-200 text-gray-900'
                        } backdrop-blur-sm`}
                      >
                        <option value="mcp">MCP Schema</option>
                        <option value="implementation">Implementation Guide</option>
                        <option value="discussion">Discussion</option>
                        <option value="showcase">Showcase</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Title
                      </label>
                      <input
                        type="text"
                        placeholder="Enter post title..."
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                            : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                        } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Content
                      </label>
                      <textarea
                        placeholder="Describe your MCP, implementation, or start a discussion..."
                        rows={6}
                        className={`w-full px-4 py-3 rounded-xl border-2 resize-none transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                            : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                        } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Tags
                      </label>
                      <input
                        type="text"
                        placeholder="Add tags separated by commas..."
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                            : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                        } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          GitHub URL (optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://github.com/..."
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                            isDark 
                              ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                              : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                          } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Demo URL (optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://demo.example.com"
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                            isDark 
                              ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                              : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                          } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowCreatePost(false)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                            : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                        } backdrop-blur-sm`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowCreatePost(false);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Publish Post
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};