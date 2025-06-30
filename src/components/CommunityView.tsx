import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Star, 
  TrendingUp, 
  Clock, 
  User, 
  Tag, 
  Search,
  Filter,
  X,
  Send,
  ThumbsUp,
  Eye,
  Play,
  Code,
  Download,
  ExternalLink,
  Users,
  Award,
  Sparkles,
  BookOpen,
  Zap
} from 'lucide-react';

interface CommunityViewProps {
  isDark: boolean;
  user: any;
  onTryInPlayground?: (mcp: any) => void;
}

interface CommunityPost {
  id: string;
  type: 'discussion' | 'showcase' | 'question' | 'tutorial';
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    reputation: number;
    verified: boolean;
  };
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  shares: number;
  createdAt: Date;
  isLiked: boolean;
  isBookmarked: boolean;
  mcpSchema?: any;
  codeSnippet?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

const mockPosts: CommunityPost[] = [
  {
    id: '1',
    type: 'showcase',
    title: 'Advanced Weather MCP with ML Predictions',
    content: 'Built a comprehensive weather MCP that uses machine learning to provide more accurate forecasts. It integrates with multiple weather APIs and provides real-time alerts.',
    author: {
      name: 'Alex Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      reputation: 2450,
      verified: true
    },
    tags: ['weather', 'ml', 'api', 'forecasting'],
    likes: 124,
    comments: 23,
    views: 1250,
    shares: 15,
    createdAt: new Date('2024-01-15'),
    isLiked: false,
    isBookmarked: false,
    difficulty: 'Advanced',
    mcpSchema: {
      name: 'weather-ml-forecast',
      version: '2.0.0',
      description: 'ML-powered weather forecasting MCP',
      tools: [
        { name: 'get_ml_forecast', description: 'Get ML-enhanced weather forecast' },
        { name: 'get_weather_alerts', description: 'Get real-time weather alerts' }
      ]
    }
  },
  {
    id: '2',
    type: 'question',
    title: 'How to handle rate limiting in MCPs?',
    content: 'I\'m building an MCP that calls external APIs frequently. What\'s the best way to implement rate limiting to avoid hitting API limits?',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      reputation: 890,
      verified: false
    },
    tags: ['rate-limiting', 'api', 'best-practices'],
    likes: 45,
    comments: 12,
    views: 567,
    shares: 3,
    createdAt: new Date('2024-01-14'),
    isLiked: true,
    isBookmarked: true,
    difficulty: 'Intermediate'
  },
  {
    id: '3',
    type: 'tutorial',
    title: 'Building Your First MCP: A Complete Guide',
    content: 'Step-by-step tutorial on creating a simple file management MCP. Perfect for beginners who want to understand the basics of MCP development.',
    author: {
      name: 'Mike Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      reputation: 3200,
      verified: true
    },
    tags: ['tutorial', 'beginner', 'file-management'],
    likes: 89,
    comments: 34,
    views: 2100,
    shares: 28,
    createdAt: new Date('2024-01-13'),
    isLiked: false,
    isBookmarked: false,
    difficulty: 'Beginner',
    codeSnippet: `{
  "name": "file-manager",
  "version": "1.0.0",
  "tools": [
    {
      "name": "read_file",
      "description": "Read file contents"
    }
  ]
}`
  },
  {
    id: '4',
    type: 'discussion',
    title: 'MCP Security Best Practices',
    content: 'Let\'s discuss the security considerations when building MCPs. What are the most important security measures to implement?',
    author: {
      name: 'Emma Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
      reputation: 1750,
      verified: true
    },
    tags: ['security', 'best-practices', 'discussion'],
    likes: 67,
    comments: 18,
    views: 890,
    shares: 8,
    createdAt: new Date('2024-01-12'),
    isLiked: false,
    isBookmarked: true,
    difficulty: 'Advanced'
  }
];

export const CommunityView: React.FC<CommunityViewProps> = ({ isDark, user, onTryInPlayground }) => {
  const [posts, setPosts] = useState<CommunityPost[]>(mockPosts);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [newPost, setNewPost] = useState({
    type: 'discussion' as CommunityPost['type'],
    title: '',
    content: '',
    tags: [] as string[],
    currentTag: ''
  });

  const postTypes = [
    { id: 'all', label: 'All Posts', icon: Users },
    { id: 'discussion', label: 'Discussions', icon: MessageCircle },
    { id: 'showcase', label: 'Showcases', icon: Star },
    { id: 'question', label: 'Questions', icon: Search },
    { id: 'tutorial', label: 'Tutorials', icon: BookOpen }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesFilter = selectedFilter === 'all' || post.type === selectedFilter;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.likes - a.likes;
      case 'trending':
        return (b.likes + b.comments + b.views) - (a.likes + a.comments + a.views);
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const handleCreatePost = () => {
    if (!user) {
      // Show auth modal or redirect to login
      return;
    }
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      return;
    }

    const post: CommunityPost = {
      id: Date.now().toString(),
      type: newPost.type,
      title: newPost.title,
      content: newPost.content,
      author: {
        name: user.name,
        avatar: user.avatar,
        reputation: 100,
        verified: false
      },
      tags: newPost.tags,
      likes: 0,
      comments: 0,
      views: 0,
      shares: 0,
      createdAt: new Date(),
      isLiked: false,
      isBookmarked: false
    };

    setPosts([post, ...posts]);
    setNewPost({
      type: 'discussion',
      title: '',
      content: '',
      tags: [],
      currentTag: ''
    });
    setShowCreatePost(false);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ));
  };

  const addTag = () => {
    if (newPost.currentTag.trim() && !newPost.tags.includes(newPost.currentTag.trim())) {
      setNewPost({
        ...newPost,
        tags: [...newPost.tags, newPost.currentTag.trim()],
        currentTag: ''
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewPost({
      ...newPost,
      tags: newPost.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'discussion': return MessageCircle;
      case 'showcase': return Star;
      case 'question': return Search;
      case 'tutorial': return BookOpen;
      default: return MessageCircle;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'discussion': return 'blue';
      case 'showcase': return 'purple';
      case 'question': return 'orange';
      case 'tutorial': return 'green';
      default: return 'blue';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Beginner': return 'green';
      case 'Intermediate': return 'yellow';
      case 'Advanced': return 'red';
      default: return 'gray';
    }
  };

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
                  Share MCPs, get help, and connect with developers
                </p>
              </div>
            </div>

            <motion.button
              onClick={() => setShowCreatePost(true)}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
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
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-600 text-white' 
                  : 'bg-white/50 border-gray-200 text-gray-900'
              } backdrop-blur-sm`}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="trending">Trending</option>
            </select>
          </div>

          {/* Post Type Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {postTypes.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                onClick={() => setSelectedFilter(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  selectedFilter === id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : isDark
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPosts.map((post, index) => {
            const PostTypeIcon = getPostTypeIcon(post.type);
            const typeColor = getPostTypeColor(post.type);
            const difficultyColor = getDifficultyColor(post.difficulty);

            return (
              <motion.div
                key={post.id}
                className={`community-post-card p-6 rounded-2xl border-2 transition-all duration-300 ${
                  isDark 
                    ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/40' 
                    : 'border-gray-200/30 bg-white/20 hover:bg-white/40'
                } backdrop-blur-sm hover:shadow-xl smooth-animation`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {post.author.name}
                        </h4>
                        {post.author.verified && (
                          <Award className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {post.author.reputation} reputation • {post.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isDark 
                        ? `bg-${typeColor}-500/20 text-${typeColor}-400` 
                        : `bg-${typeColor}-100 text-${typeColor}-700`
                    }`}>
                      {post.type}
                    </span>
                    {post.difficulty && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isDark 
                          ? `bg-${difficultyColor}-500/20 text-${difficultyColor}-400` 
                          : `bg-${difficultyColor}-100 text-${difficultyColor}-700`
                      }`}>
                        {post.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {post.title}
                  </h3>
                  <p className={`text-sm line-clamp-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {post.content}
                  </p>
                </div>

                {/* Code Snippet */}
                {post.codeSnippet && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    isDark ? 'bg-gray-900/50' : 'bg-gray-100/50'
                  } font-mono text-sm overflow-x-auto`}>
                    <pre className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {post.codeSnippet}
                    </pre>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, tagIndex) => (
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
                </div>

                {/* Post Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span>{post.comments}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span>{post.views}</span>
                    </div>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                        post.isLiked
                          ? 'bg-red-500/20 text-red-400'
                          : isDark
                            ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm">Like</span>
                    </motion.button>

                    <motion.button
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                        isDark
                          ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Comment</span>
                    </motion.button>

                    <motion.button
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                        isDark
                          ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                          : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </motion.button>
                  </div>

                  {post.mcpSchema && onTryInPlayground && (
                    <motion.button
                      onClick={() => onTryInPlayground(post.mcpSchema)}
                      className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-4 h-4" />
                      <span className="text-sm">Try in Playground</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Users className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No posts found
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreatePost && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowCreatePost(false)}
              />
              
              <motion.div
                className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl backdrop-blur-xl border ${
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

                  <div className="space-y-6">
                    {/* Post Type */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Post Type
                      </label>
                      <select
                        value={newPost.type}
                        onChange={(e) => setNewPost({...newPost, type: e.target.value as any})}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-900/50 border-gray-600 text-white' 
                            : 'bg-white/50 border-gray-200 text-gray-900'
                        } backdrop-blur-sm`}
                      >
                        <option value="discussion">Discussion</option>
                        <option value="showcase">Showcase</option>
                        <option value="question">Question</option>
                        <option value="tutorial">Tutorial</option>
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
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
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
                        rows={6}
                        className={`w-full px-4 py-3 rounded-xl border-2 resize-none transition-all duration-300 ${
                          isDark 
                            ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                            : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                        } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Tags
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={newPost.currentTag}
                          onChange={(e) => setNewPost({...newPost, currentTag: e.target.value})}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          placeholder="Add a tag..."
                          className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all duration-300 ${
                            isDark 
                              ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                              : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                          } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                        />
                        <motion.button
                          onClick={addTag}
                          className="px-4 py-2 bg-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:bg-purple-600"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Add
                        </motion.button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {newPost.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                              isDark 
                                ? 'bg-purple-500/20 text-purple-300' 
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            <span>#{tag}</span>
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-4 mt-8">
                    <motion.button
                      onClick={() => setShowCreatePost(false)}
                      className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isDark 
                          ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300' 
                          : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleCreatePost}
                      disabled={!newPost.title.trim() || !newPost.content.trim()}
                      className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        newPost.title.trim() && newPost.content.trim()
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                          : isDark
                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-200/50 text-gray-500 cursor-not-allowed'
                      }`}
                      whileHover={newPost.title.trim() && newPost.content.trim() ? { scale: 1.02 } : {}}
                      whileTap={newPost.title.trim() && newPost.content.trim() ? { scale: 0.98 } : {}}
                    >
                      <Send className="w-5 h-5" />
                      <span>Publish Post</span>
                    </motion.button>
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