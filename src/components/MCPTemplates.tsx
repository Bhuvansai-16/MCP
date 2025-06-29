import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookTemplate as FileTemplate, 
  Cloud, 
  ShoppingCart, 
  Plane, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Database, 
  Zap, 
  Search, 
  Info, 
  Play, 
  Download, 
  Star, 
  CheckCircle,
  X,
  Filter,
  Tag,
  Sparkles,
  Heart,
  ThumbsUp,
  Clock
} from 'lucide-react';
import { MCPSchema } from '../App';

interface MCPTemplatesProps {
  isDark: boolean;
  onTemplateSelect: (template: MCPSchema) => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  useCase: string;
  schema: MCPSchema;
  tags: string[];
  popularity: number;
  rating: number;
  lastUpdated: string;
  author: string;
  downloads: number;
}

const templates: Template[] = [
  {
    id: 'weather-api',
    name: 'Weather API',
    description: 'Real-time weather data with forecasting capabilities',
    category: 'Data & APIs',
    icon: Cloud,
    difficulty: 'Beginner',
    useCase: 'Get current weather, forecasts, and weather alerts for any location worldwide',
    tags: ['weather', 'api', 'forecast', 'location'],
    popularity: 95,
    rating: 4.8,
    lastUpdated: '2023-12-15',
    author: 'MCP Team',
    downloads: 12500,
    schema: {
      name: "weather.forecast",
      version: "1.0.0",
      description: "Real-time weather data and forecasting with global coverage",
      tools: [
        {
          name: "get_current_weather",
          description: "Get current weather conditions for a specific location",
          parameters: {
            location: "string",
            units: "string"
          }
        },
        {
          name: "get_forecast",
          description: "Get weather forecast for the next 7 days",
          parameters: {
            location: "string",
            days: "number",
            units: "string"
          }
        },
        {
          name: "get_weather_alerts",
          description: "Get active weather alerts and warnings",
          parameters: {
            location: "string",
            severity: "string"
          }
        }
      ]
    }
  },
  {
    id: 'ecommerce-store',
    name: 'E-commerce Store',
    description: 'Complete online store management with inventory and orders',
    category: 'E-commerce',
    icon: ShoppingCart,
    difficulty: 'Intermediate',
    useCase: 'Manage products, process orders, handle inventory, and track sales',
    tags: ['ecommerce', 'shopping', 'inventory', 'orders'],
    popularity: 88,
    rating: 4.6,
    lastUpdated: '2023-11-20',
    author: 'Commerce Team',
    downloads: 9800,
    schema: {
      name: "ecommerce.store",
      version: "2.1.0",
      description: "Complete e-commerce functionality with product management",
      tools: [
        {
          name: "search_products",
          description: "Search for products in the store catalog",
          parameters: {
            query: "string",
            category: "string",
            price_range: "object",
            in_stock: "boolean"
          }
        },
        {
          name: "add_to_cart",
          description: "Add product to shopping cart",
          parameters: {
            product_id: "string",
            quantity: "number",
            variant_id: "string"
          }
        },
        {
          name: "process_payment",
          description: "Process payment for cart items",
          parameters: {
            payment_method: "string",
            amount: "number",
            currency: "string"
          }
        },
        {
          name: "track_order",
          description: "Track order status and shipping",
          parameters: {
            order_id: "string"
          }
        }
      ]
    }
  },
  {
    id: 'travel-planner',
    name: 'Travel Planner',
    description: 'Comprehensive travel booking and itinerary management',
    category: 'Travel & Booking',
    icon: Plane,
    difficulty: 'Advanced',
    useCase: 'Book flights, hotels, create itineraries, and manage travel expenses',
    tags: ['travel', 'booking', 'flights', 'hotels', 'itinerary'],
    popularity: 82,
    rating: 4.7,
    lastUpdated: '2023-12-05',
    author: 'Travel Team',
    downloads: 7600,
    schema: {
      name: "travel.planner",
      version: "3.0.0",
      description: "Comprehensive travel booking and itinerary management",
      tools: [
        {
          name: "search_flights",
          description: "Search for available flights",
          parameters: {
            origin: "string",
            destination: "string",
            departure_date: "date",
            return_date: "date",
            passengers: "number"
          }
        },
        {
          name: "book_hotel",
          description: "Book hotel accommodation",
          parameters: {
            location: "string",
            check_in: "date",
            check_out: "date",
            guests: "number",
            room_type: "string"
          }
        },
        {
          name: "create_itinerary",
          description: "Create detailed travel itinerary",
          parameters: {
            destination: "string",
            duration: "number",
            interests: "array",
            budget: "number"
          }
        },
        {
          name: "get_local_recommendations",
          description: "Get local attractions and restaurant recommendations",
          parameters: {
            location: "string",
            category: "string",
            radius: "number"
          }
        }
      ]
    }
  },
  {
    id: 'calendar-scheduler',
    name: 'Calendar Scheduler',
    description: 'Smart calendar management with meeting scheduling',
    category: 'Productivity',
    icon: Calendar,
    difficulty: 'Beginner',
    useCase: 'Schedule meetings, manage events, set reminders, and coordinate calendars',
    tags: ['calendar', 'scheduling', 'meetings', 'events'],
    popularity: 76,
    rating: 4.5,
    lastUpdated: '2023-10-30',
    author: 'Productivity Team',
    downloads: 6200,
    schema: {
      name: "calendar.scheduler",
      version: "1.3.0",
      description: "Smart calendar management with meeting scheduling",
      tools: [
        {
          name: "create_event",
          description: "Create a new calendar event",
          parameters: {
            title: "string",
            start_time: "datetime",
            end_time: "datetime",
            attendees: "array",
            location: "string"
          }
        },
        {
          name: "find_available_slots",
          description: "Find available time slots for scheduling",
          parameters: {
            duration: "number",
            attendees: "array",
            preferred_times: "array"
          }
        },
        {
          name: "schedule_meeting",
          description: "Schedule a meeting with automatic conflict resolution",
          parameters: {
            title: "string",
            attendees: "array",
            duration: "number",
            priority: "string"
          }
        },
        {
          name: "set_reminder",
          description: "Set reminders for events",
          parameters: {
            event_id: "string",
            reminder_time: "number",
            reminder_type: "string"
          }
        }
      ]
    }
  },
  {
    id: 'finance-tracker',
    name: 'Finance Tracker',
    description: 'Personal finance management with budgeting and analytics',
    category: 'Finance',
    icon: DollarSign,
    difficulty: 'Intermediate',
    useCase: 'Track expenses, manage budgets, analyze spending patterns, and financial goals',
    tags: ['finance', 'budgeting', 'expenses', 'analytics'],
    popularity: 71,
    rating: 4.4,
    lastUpdated: '2023-11-10',
    author: 'Finance Team',
    downloads: 5400,
    schema: {
      name: "finance.tracker",
      version: "2.0.0",
      description: "Personal finance management with budgeting and analytics",
      tools: [
        {
          name: "add_transaction",
          description: "Add a new financial transaction",
          parameters: {
            amount: "number",
            category: "string",
            description: "string",
            date: "date",
            account: "string"
          }
        },
        {
          name: "create_budget",
          description: "Create a budget for a category",
          parameters: {
            category: "string",
            amount: "number",
            period: "string"
          }
        },
        {
          name: "get_spending_analysis",
          description: "Get detailed spending analysis and insights",
          parameters: {
            period: "string",
            categories: "array"
          }
        },
        {
          name: "set_financial_goal",
          description: "Set and track financial goals",
          parameters: {
            goal_type: "string",
            target_amount: "number",
            deadline: "date"
          }
        }
      ]
    }
  },
  {
    id: 'social-media',
    name: 'Social Media Manager',
    description: 'Multi-platform social media posting and analytics',
    category: 'Social Media',
    icon: MessageSquare,
    difficulty: 'Advanced',
    useCase: 'Schedule posts, analyze engagement, manage multiple accounts, and track metrics',
    tags: ['social', 'posting', 'analytics', 'engagement'],
    popularity: 68,
    rating: 4.3,
    lastUpdated: '2023-09-25',
    author: 'Social Team',
    downloads: 4800,
    schema: {
      name: "social.media",
      version: "1.5.0",
      description: "Multi-platform social media posting and analytics",
      tools: [
        {
          name: "create_post",
          description: "Create and schedule social media posts",
          parameters: {
            content: "string",
            platforms: "array",
            schedule_time: "datetime",
            media: "array"
          }
        },
        {
          name: "get_analytics",
          description: "Get social media analytics and insights",
          parameters: {
            platform: "string",
            period: "string",
            metrics: "array"
          }
        },
        {
          name: "manage_comments",
          description: "Moderate and respond to comments",
          parameters: {
            post_id: "string",
            action: "string",
            response: "string"
          }
        },
        {
          name: "track_hashtags",
          description: "Track hashtag performance and trends",
          parameters: {
            hashtags: "array",
            platform: "string"
          }
        }
      ]
    }
  },
  {
    id: 'database-manager',
    name: 'Database Manager',
    description: 'Database operations and management tools',
    category: 'Development',
    icon: Database,
    difficulty: 'Advanced',
    useCase: 'Query databases, manage tables, perform CRUD operations, and analyze data',
    tags: ['database', 'sql', 'data', 'query'],
    popularity: 65,
    rating: 4.6,
    lastUpdated: '2023-10-15',
    author: 'Dev Team',
    downloads: 4200,
    schema: {
      name: "database.manager",
      version: "2.2.0",
      description: "Database operations and management tools",
      tools: [
        {
          name: "execute_query",
          description: "Execute SQL query on database",
          parameters: {
            query: "string",
            database: "string",
            params: "array"
          }
        },
        {
          name: "create_table",
          description: "Create a new database table",
          parameters: {
            table_name: "string",
            columns: "array",
            database: "string"
          }
        },
        {
          name: "insert_data",
          description: "Insert data into a table",
          parameters: {
            table_name: "string",
            data: "object",
            database: "string"
          }
        },
        {
          name: "export_data",
          description: "Export data from database",
          parameters: {
            query: "string",
            format: "string",
            database: "string"
          }
        }
      ]
    }
  },
  {
    id: 'search-engine',
    name: 'Search Engine',
    description: 'Advanced search capabilities across multiple sources',
    category: 'Data & APIs',
    icon: Search,
    difficulty: 'Intermediate',
    useCase: 'Search web, documents, databases, and custom sources with advanced filtering',
    tags: ['search', 'web', 'documents', 'filtering'],
    popularity: 73,
    rating: 4.5,
    lastUpdated: '2023-11-28',
    author: 'Search Team',
    downloads: 5800,
    schema: {
      name: "search.engine",
      version: "3.1.0",
      description: "Advanced search capabilities across multiple sources",
      tools: [
        {
          name: "web_search",
          description: "Search the web for information",
          parameters: {
            query: "string",
            limit: "number",
            filters: "object"
          }
        },
        {
          name: "document_search",
          description: "Search within documents",
          parameters: {
            query: "string",
            document_ids: "array",
            file_types: "array"
          }
        },
        {
          name: "image_search",
          description: "Search for images",
          parameters: {
            query: "string",
            size: "string",
            color: "string",
            type: "string"
          }
        },
        {
          name: "news_search",
          description: "Search for news articles",
          parameters: {
            query: "string",
            date_range: "object",
            sources: "array"
          }
        }
      ]
    }
  }
];

export const MCPTemplates: React.FC<MCPTemplatesProps> = ({ isDark, onTemplateSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'downloads' | 'name'>('popularity');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteTemplates, setFavoriteTemplates] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [dailyHighlight, setDailyHighlight] = useState<Template | null>(null);

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)));

  // Set daily highlight on component mount
  useEffect(() => {
    // Use the day of the year to pick a template
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Use the day of year to pick a template (cycle through all templates)
    const highlightIndex = dayOfYear % templates.length;
    setDailyHighlight(templates[highlightIndex]);
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteTemplates');
    if (savedFavorites) {
      setFavoriteTemplates(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage when changed
  useEffect(() => {
    localStorage.setItem('favoriteTemplates', JSON.stringify(Array.from(favoriteTemplates)));
  }, [favoriteTemplates]);

  const toggleFavorite = (templateId: string) => {
    const newFavorites = new Set(favoriteTemplates);
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId);
    } else {
      newFavorites.add(templateId);
    }
    setFavoriteTemplates(newFavorites);
  };

  const toggleTagFilter = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const filteredTemplates = templates.filter(template => {
    // Filter by favorites if enabled
    if (showFavoritesOnly && !favoriteTemplates.has(template.id)) {
      return false;
    }
    
    // Filter by category
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    
    // Filter by difficulty
    const matchesDifficulty = selectedDifficulty === 'All' || template.difficulty === selectedDifficulty;
    
    // Filter by tags
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => template.tags.includes(tag));
    
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesDifficulty && matchesTags && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'downloads':
        return b.downloads - a.downloads;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return b.popularity - a.popularity;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'green';
      case 'Intermediate': return 'yellow';
      case 'Advanced': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className={`h-full rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
      isDark 
        ? 'bg-gray-800/30 border-gray-700/50' 
        : 'bg-white/30 border-white/50'
    } shadow-2xl flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FileTemplate className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                MCP Templates
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Pre-built templates for common use cases
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                showFilters
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
              <Filter className="w-4 h-4" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
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
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              <span>Favorites</span>
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border-2 transition-all duration-300 ${
              isDark 
                ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' 
                : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500'
            } focus:ring-2 focus:ring-green-500/20 backdrop-blur-sm`}
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-900/50 border-gray-600 text-white' 
                        : 'bg-white/50 border-gray-200 text-gray-900'
                    } backdrop-blur-sm`}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-900/50 border-gray-600 text-white' 
                        : 'bg-white/50 border-gray-200 text-gray-900'
                    } backdrop-blur-sm`}
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
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
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-900/50 border-gray-600 text-white' 
                        : 'bg-white/50 border-gray-200 text-gray-900'
                    } backdrop-blur-sm`}
                  >
                    <option value="popularity">Popularity</option>
                    <option value="rating">Rating</option>
                    <option value="downloads">Downloads</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Filter by Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`px-2 py-1 rounded-full text-xs transition-all duration-300 ${
                        selectedTags.includes(tag)
                          ? isDark
                            ? 'bg-green-500 text-white'
                            : 'bg-green-500 text-white'
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Daily Highlight */}
        {dailyHighlight && (
          <div className={`p-4 rounded-xl mb-4 ${
            isDark ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              <h3 className={`font-medium text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                Today's Highlight
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <dailyHighlight.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {dailyHighlight.name}
                </h4>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {dailyHighlight.description}
                </p>
              </div>
              <motion.button
                onClick={() => onTemplateSelect(dailyHighlight.schema)}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs bg-white text-green-600 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-3 h-3" />
                <span>Try Now</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-green-500 text-white'
                  : isDark
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    : 'bg-gray-100/50 text-gray-600 hover:bg-gray-200/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template, index) => {
            const Icon = template.icon;
            const difficultyColor = getDifficultyColor(template.difficulty);
            const isFavorite = favoriteTemplates.has(template.id);
            
            return (
              <motion.div
                key={template.id}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  isDark 
                    ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/40' 
                    : 'border-gray-200/30 bg-white/20 hover:bg-white/40'
                } backdrop-blur-sm hover:shadow-xl`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {template.name}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {template.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isDark 
                        ? `bg-${difficultyColor}-500/20 text-${difficultyColor}-400` 
                        : `bg-${difficultyColor}-100 text-${difficultyColor}-700`
                    }`}>
                      {template.difficulty}
                    </span>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(template.id);
                      }}
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

                <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className={`px-2 py-1 text-xs rounded-full ${
                        isDark 
                          ? 'bg-gray-600/50 text-gray-300' 
                          : 'bg-gray-100/50 text-gray-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isDark ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-100/50 text-gray-600'
                    }`}>
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {template.rating}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Download className="w-3 h-3 text-gray-400" />
                      <span className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {template.downloads.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(template.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTemplateSelect(template.schema);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play className="w-3 h-3" />
                    <span>Use Template</span>
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                    }}
                    className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                        : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Info className="w-3 h-3" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileTemplate className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No templates found
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedTemplate(null)}
            />
            <motion.div
              className={`relative w-full max-w-2xl rounded-3xl backdrop-blur-xl border ${
                isDark 
                  ? 'bg-gray-800/90 border-gray-700/50' 
                  : 'bg-white/90 border-white/50'
              } shadow-2xl`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                      <selectedTemplate.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedTemplate.name}
                        </h2>
                        <motion.button
                          onClick={() => toggleFavorite(selectedTemplate.id)}
                          className={`p-1 rounded-lg transition-colors`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {favoriteTemplates.has(selectedTemplate.id) ? (
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          ) : (
                            <Star className="w-5 h-5 text-gray-400" />
                          )}
                        </motion.button>
                      </div>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedTemplate.category}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
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
                  <div className="flex items-center justify-between">
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      isDark 
                        ? `bg-${getDifficultyColor(selectedTemplate.difficulty)}-500/20 text-${getDifficultyColor(selectedTemplate.difficulty)}-400` 
                        : `bg-${getDifficultyColor(selectedTemplate.difficulty)}-100 text-${getDifficultyColor(selectedTemplate.difficulty)}-700`
                    }`}>
                      {selectedTemplate.difficulty} Level
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                        <span className={`ml-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {selectedTemplate.rating}/5
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Download className="w-4 h-4 text-blue-500" />
                        <span className={`ml-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {selectedTemplate.downloads.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Description
                    </h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedTemplate.description}
                    </p>
                  </div>

                  <div>
                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Use Case
                    </h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedTemplate.useCase}
                    </p>
                  </div>

                  <div>
                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Available Tools ({selectedTemplate.schema.tools.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedTemplate.schema.tools.map((tool, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <Zap className="w-4 h-4 text-green-500" />
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {tool.name}
                            </span>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {tool.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <motion.button
                      onClick={() => {
                        onTemplateSelect(selectedTemplate.schema);
                        setSelectedTemplate(null);
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-5 h-5" />
                      <span>Use This Template</span>
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