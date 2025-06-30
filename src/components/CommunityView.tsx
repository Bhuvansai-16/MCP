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
  X,
  Image,
  Link,
  Hash,
  Save,
  Loader
} from 'lucide-react';
import { MCPListItem, WebMCPResult } from '../data/mockMCPs';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

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

interface CreatePostData {
  title: string;
  content: string;
  type: 'mcp' | 'implementation' | 'discussion' | 'showcase';
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  mcpSchema?: any;
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
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mcp' | 'implementation' | 'discussion' | 'showcase'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [newPostData, setNewPostData] = useState<CreatePostData>({
    title: '',
    content: '',
    type: 'discussion',
    tags: [],
    githubUrl: '',
    demoUrl: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [activeUsers, setActiveUsers] = useState<{id: string, name: string, avatar: string}[]>([
    { id: 'user5', name: 'Emma Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma' },
    { id: 'user6', name: 'James Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james' },
    { id: 'user7', name: 'Olivia Garcia', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia' }
  ]);

  // Load comments for a post
  useEffect(() => {
    if (selectedPost) {
      if (!comments[selectedPost.id]) {
        // Simulate loading comments
        const mockComments = generateMockComments(selectedPost.id, selectedPost.comments);
        setComments(prev => ({
          ...prev,
          [selectedPost.id]: mockComments
        }));
      }
    }
  }, [selectedPost]);

  // Simulate active users with setInterval
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add or remove a user
      if (Math.random() > 0.7) {
        const randomNames = ['Taylor', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Avery', 'Quinn'];
        const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
        
        if (activeUsers.length < 8 && Math.random() > 0.5) {
          // Add a new user
          setActiveUsers(prev => [
            ...prev,
            {
              id: `user${Date.now()}`,
              name: `${randomName} ${Math.floor(Math.random() * 1000)}`,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}${Date.now()}`
            }
          ]);
        } else if (activeUsers.length > 3) {
          // Remove a random user (except first 3)
          const indexToRemove = Math.floor(Math.random() * (activeUsers.length - 3)) + 3;
          setActiveUsers(prev => prev.filter((_, i) => i !== indexToRemove));
        }
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [activeUsers]);

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

  // Generate mock comments for a post
  const generateMockComments = (postId: string, count: number): Comment[] => {
    const mockComments: Comment[] = [];
    const commentAuthors = [
      { id: 'user5', name: 'Emma Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma', verified: false },
      { id: 'user6', name: 'James Lee', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james', verified: true },
      { id: 'user7', name: 'Olivia Garcia', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=olivia', verified: false },
      { id: 'user8', name: 'Noah Martinez', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=noah', verified: false }
    ];
    
    const commentContents = [
      "This is really impressive work! I've been looking for something like this.",
      "Great implementation. Have you considered adding support for custom parameters?",
      "Thanks for sharing this. I'll definitely try it out in my next project.",
      "Interesting approach. I wonder how this performs with larger datasets?",
      "This is exactly what I needed for my current project. Thanks for sharing!",
      "Very well documented. Makes it easy to understand and implement.",
      "Have you tested this with the latest API version?",
      "I've been working on something similar. Would love to collaborate!",
      "This solves a problem I've been struggling with for weeks. Thank you!"
    ];
    
    for (let i = 0; i < count; i++) {
      const author = commentAuthors[Math.floor(Math.random() * commentAuthors.length)];
      const content = commentContents[Math.floor(Math.random() * commentContents.length)];
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(date.getHours() - hoursAgo);
      
      mockComments.push({
        id: `comment-${postId}-${i}`,
        author,
        content,
        likes: Math.floor(Math.random() * 15),
        isLiked: Math.random() > 0.7,
        createdAt: date
      });
    }
    
    // Sort by date (newest first)
    return mockComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

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
      toast.success('Post link copied to clipboard!');
    });
  }, []);

  const handleCommentLike = useCallback((postId: string, commentId: string) => {
    setComments(prev => {
      const postComments = [...(prev[postId] || [])];
      const commentIndex = postComments.findIndex(c => c.id === commentId);
      
      if (commentIndex !== -1) {
        const comment = postComments[commentIndex];
        postComments[commentIndex] = {
          ...comment,
          isLiked: !comment.isLiked,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
        };
      }
      
      return {
        ...prev,
        [postId]: postComments
      };
    });
  }, []);

  const handleComment = useCallback(async (postId: string) => {
    if (!newComment.trim() || !isAuthenticated) return;
    
    setIsSubmittingComment(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const comment: Comment = {
        id: `comment-${postId}-${Date.now()}`,
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

      // Add comment to the post's comments
      setComments(prev => ({
        ...prev,
        [postId]: [comment, ...(prev[postId] || [])]
      }));
      
      // Update post comment count
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments: post.comments + 1 } : post
      ));
      
      setNewComment('');
      toast.success('Comment added successfully!');
    } catch (error) {
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  }, [newComment, user, isAuthenticated]);

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

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      toast.error('You must be signed in to create a post');
      return;
    }
    
    if (!newPostData.title.trim() || !newPostData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    
    setIsSubmittingPost(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const newPost: Post = {
        id: `post-${Date.now()}`,
        author: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          verified: user.verified || false,
          reputation: user.reputation || Math.floor(Math.random() * 1000)
        },
        title: newPostData.title,
        content: newPostData.content,
        type: newPostData.type,
        tags: newPostData.tags,
        githubUrl: newPostData.githubUrl,
        demoUrl: newPostData.demoUrl,
        mcpSchema: newPostData.mcpSchema,
        likes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        views: 1,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add new post to the beginning of the list
      setPosts(prev => [newPost, ...prev]);
      
      // Reset form
      setNewPostData({
        title: '',
        content: '',
        type: 'discussion',
        tags: [],
        githubUrl: '',
        demoUrl: '',
      });
      
      setShowCreatePost(false);
      toast.success('Post created successfully!');
    } catch (error) {
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // Don't add duplicate tags
    if (newPostData.tags.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    
    setNewPostData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));
    
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setNewPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

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
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error('Please sign in to create a post');
                  return;
                }
                setShowCreatePost(true);
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              <span>Create Post</span>
            </motion.button>
          </div>

          {/* Active Users */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="relative flex -space-x-2">
                {activeUsers.slice(0, 5).map((user, index) => (
                  <div 
                    key={user.id} 
                    className="relative"
                    style={{ zIndex: 10 - index }}
                  >
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                      title={user.name}
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800"></span>
                  </div>
                ))}
                {activeUsers.length > 5 && (
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      isDark 
                        ? 'bg-gray-700 text-white border-2 border-gray-800' 
                        : 'bg-gray-200 text-gray-800 border-2 border-white'
                    }`}
                    style={{ zIndex: 5 }}
                  >
                    +{activeUsers.length - 5}
                  </div>
                )}
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} active now
              </span>
            </div>
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
                        if (!isAuthenticated) {
                          toast.error('Please sign in to like posts');
                          return;
                        }
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
                        if (!isAuthenticated) {
                          toast.error('Please sign in to bookmark posts');
                          return;
                        }
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
                className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl backdrop-blur-xl border ${
                  isDark 
                    ? 'bg-gray-800/90 border-gray-700/50' 
                    : 'bg-white/90 border-white/50'
                } shadow-2xl`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex flex-col h-full max-h-[90vh]">
                  {/* Modal Header - Fixed */}
                  <div className="flex-shrink-0 p-6 border-b border-gray-200/20">
                    <div className="flex items-center justify-between">
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
                  </div>

                  {/* Post Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto scrollable-container">
                    <div className="p-6">
                      <div className="mb-6">
                        <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedPost.title}
                        </h1>
                        <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {selectedPost.content}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {selectedPost.tags.map((tag, tagIndex) => (
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
                      {(selectedPost.githubUrl || selectedPost.demoUrl) && (
                        <div className="flex space-x-3 mb-6">
                          {selectedPost.githubUrl && (
                            <a
                              href={selectedPost.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm transition-colors ${
                                isDark 
                                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                              }`}
                            >
                              <Github className="w-4 h-4" />
                              <span>View Code</span>
                            </a>
                          )}
                          {selectedPost.demoUrl && (
                            <a
                              href={selectedPost.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm transition-colors ${
                                isDark 
                                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                              }`}
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>View Demo</span>
                            </a>
                          )}
                        </div>
                      )}

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

                      {/* Post Actions */}
                      <div className="flex items-center justify-between py-4 border-t border-b border-gray-200/20 mb-6">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                toast.error('Please sign in to like posts');
                                return;
                              }
                              handleLike(selectedPost.id);
                            }}
                            className={`flex items-center space-x-2 transition-colors ${
                              selectedPost.isLiked 
                                ? 'text-red-500' 
                                : isDark 
                                  ? 'text-gray-400 hover:text-red-400' 
                                  : 'text-gray-600 hover:text-red-600'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${selectedPost.isLiked ? 'fill-current' : ''}`} />
                            <span className="font-medium">{selectedPost.likes}</span>
                          </button>

                          <button
                            onClick={() => handleShare(selectedPost)}
                            className={`flex items-center space-x-2 transition-colors ${
                              isDark 
                                ? 'text-gray-400 hover:text-green-400' 
                                : 'text-gray-600 hover:text-green-600'
                            }`}
                          >
                            <Share2 className="w-5 h-5" />
                            <span className="font-medium">{selectedPost.shares}</span>
                          </button>

                          <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                toast.error('Please sign in to bookmark posts');
                                return;
                              }
                              handleBookmark(selectedPost.id);
                            }}
                            className={`flex items-center space-x-2 transition-colors ${
                              selectedPost.isBookmarked 
                                ? 'text-yellow-500' 
                                : isDark 
                                  ? 'text-gray-400 hover:text-yellow-400' 
                                  : 'text-gray-600 hover:text-yellow-600'
                            }`}
                          >
                            <Bookmark className={`w-5 h-5 ${selectedPost.isBookmarked ? 'fill-current' : ''}`} />
                            <span className="font-medium">{selectedPost.bookmarks}</span>
                          </button>
                        </div>

                        <div className={`flex items-center space-x-2 text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <Eye className="w-4 h-4" />
                          <span>{selectedPost.views} views</span>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div>
                        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Comments ({selectedPost.comments})
                        </h3>

                        {/* Add Comment */}
                        {isAuthenticated ? (
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
                                    disabled={!newComment.trim() || isSubmittingComment}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                                      !newComment.trim() || isSubmittingComment
                                        ? isDark
                                          ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                          : 'bg-gray-200/50 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                                    }`}
                                  >
                                    {isSubmittingComment ? (
                                      <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>Posting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4" />
                                        <span>Comment</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`p-4 rounded-xl mb-6 ${
                            isDark ? 'bg-gray-700/30' : 'bg-gray-100/30'
                          }`}>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Please sign in to add a comment.
                            </p>
                          </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-4">
                          {comments[selectedPost.id]?.map((comment) => (
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
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        toast.error('Please sign in to like comments');
                                        return;
                                      }
                                      handleCommentLike(selectedPost.id, comment.id);
                                    }}
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
                                    onClick={() => {
                                      if (!isAuthenticated) {
                                        toast.error('Please sign in to reply');
                                        return;
                                      }
                                      setNewComment(`@${comment.author.name} `);
                                    }}
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

                          {/* Loading state for comments */}
                          {!comments[selectedPost.id] && (
                            <div className="flex justify-center py-4">
                              <Loader className={`w-8 h-8 animate-spin ${
                                isDark ? 'text-purple-400' : 'text-purple-600'
                              }`} />
                            </div>
                          )}

                          {/* No comments state */}
                          {comments[selectedPost.id]?.length === 0 && (
                            <div className={`p-4 rounded-xl text-center ${
                              isDark ? 'bg-gray-700/30' : 'bg-gray-100/30'
                            }`}>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                No comments yet. Be the first to comment!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
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
                className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl backdrop-blur-xl border ${
                  isDark 
                    ? 'bg-gray-800/90 border-gray-700/50' 
                    : 'bg-white/90 border-white/50'
                } shadow-2xl`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex flex-col h-full max-h-[90vh]">
                  {/* Modal Header - Fixed */}
                  <div className="flex-shrink-0 p-6 border-b border-gray-200/20">
                    <div className="flex items-center justify-between">
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
                  </div>

                  {/* Form Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto scrollable-container">
                    <div className="p-6 space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Post Type
                        </label>
                        <select
                          value={newPostData.type}
                          onChange={(e) => setNewPostData({...newPostData, type: e.target.value as any})}
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
                          value={newPostData.title}
                          onChange={(e) => setNewPostData({...newPostData, title: e.target.value})}
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
                          value={newPostData.content}
                          onChange={(e) => setNewPostData({...newPostData, content: e.target.value})}
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
                        <div className="flex items-center space-x-2">
                          <div className="relative flex-1">
                            <Hash className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <input
                              type="text"
                              placeholder="Add a tag..."
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                                isDark 
                                  ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                                  : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                              } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                            />
                          </div>
                          <motion.button
                            onClick={handleAddTag}
                            disabled={!tagInput.trim()}
                            className={`px-4 py-3 rounded-xl transition-all duration-300 ${
                              !tagInput.trim()
                                ? isDark
                                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-200/50 text-gray-500 cursor-not-allowed'
                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                            }`}
                            whileHover={tagInput.trim() ? { scale: 1.05 } : {}}
                            whileTap={tagInput.trim() ? { scale: 0.95 } : {}}
                          >
                            Add
                          </motion.button>
                        </div>
                        
                        {/* Tag List */}
                        {newPostData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {newPostData.tags.map((tag, index) => (
                              <div 
                                key={index}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                                  isDark 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                                }`}
                              >
                                <span>#{tag}</span>
                                <button
                                  onClick={() => handleRemoveTag(tag)}
                                  className="hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            GitHub URL (optional)
                          </label>
                          <div className="relative">
                            <Github className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <input
                              type="url"
                              placeholder="https://github.com/..."
                              value={newPostData.githubUrl || ''}
                              onChange={(e) => setNewPostData({...newPostData, githubUrl: e.target.value})}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                                isDark 
                                  ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                                  : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                              } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Demo URL (optional)
                          </label>
                          <div className="relative">
                            <Link className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <input
                              type="url"
                              placeholder="https://demo.example.com"
                              value={newPostData.demoUrl || ''}
                              onChange={(e) => setNewPostData({...newPostData, demoUrl: e.target.value})}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                                isDark 
                                  ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                                  : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                              } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Image Upload (Optional) */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Add Image (optional)
                        </label>
                        <div className={`p-4 border-2 border-dashed rounded-xl text-center ${
                          isDark 
                            ? 'border-gray-600 bg-gray-900/30' 
                            : 'border-gray-300 bg-gray-50/30'
                        }`}>
                          <Image className={`w-8 h-8 mx-auto mb-2 ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Drag and drop an image, or click to browse
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Supports JPG, PNG, GIF (max 5MB)
                          </p>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer - Fixed */}
                  <div className="flex-shrink-0 p-6 border-t border-gray-200/20">
                    <div className="flex justify-end space-x-3">
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
                        onClick={handleCreatePost}
                        disabled={!newPostData.title.trim() || !newPostData.content.trim() || isSubmittingPost}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                          !newPostData.title.trim() || !newPostData.content.trim() || isSubmittingPost
                            ? isDark
                              ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-200/50 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {isSubmittingPost ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Publishing...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Publish Post</span>
                          </>
                        )}
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