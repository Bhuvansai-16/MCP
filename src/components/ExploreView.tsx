import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, Shield, Download, Play, Eye, X, Code, Tag, Globe, Users } from 'lucide-react';

interface MCP {
  id: string;
  name: string;
  description: string;
  tags: string[];
  domain: string;
  featured: boolean;
  validated: boolean;
  popularity: number;
  sourceUrl: string;
  schema: string;
  compatibleModels: string[];
}

interface ExploreViewProps {
  isDark: boolean;
}

const mockMCPs: MCP[] = [
  {
    id: '1',
    name: 'airbnb.bookings',
    description: 'Complete Airbnb booking management with search, reservations, and host communication',
    tags: ['Travel', 'Booking', 'API'],
    domain: 'travel',
    featured: true,
    validated: true,
    popularity: 95,
    sourceUrl: 'https://github.com/airbnb/mcp-bookings',
    schema: `{
  "name": "airbnb.bookings",
  "version": "1.0.0",
  "tools": [
    {
      "name": "search_properties",
      "description": "Search for available properties",
      "parameters": {
        "location": "string",
        "check_in": "date",
        "check_out": "date",
        "guests": "number"
      }
    }
  ]
}`,
    compatibleModels: ['GPT-4', 'Claude-3', 'Gemini Pro']
  },
  {
    id: '2',
    name: 'stripe.payments',
    description: 'Secure payment processing with Stripe integration for e-commerce applications',
    tags: ['Finance', 'Payments', 'E-commerce'],
    domain: 'finance',
    featured: true,
    validated: true,
    popularity: 88,
    sourceUrl: 'https://github.com/stripe/mcp-payments',
    schema: `{
  "name": "stripe.payments",
  "version": "2.1.0",
  "tools": [
    {
      "name": "create_payment_intent",
      "description": "Create a new payment intent",
      "parameters": {
        "amount": "number",
        "currency": "string",
        "customer_id": "string"
      }
    }
  ]
}`,
    compatibleModels: ['GPT-4', 'Claude-3']
  },
  {
    id: '3',
    name: 'github.repos',
    description: 'GitHub repository management including issues, PRs, and code analysis',
    tags: ['Development', 'Git', 'Code'],
    domain: 'development',
    featured: false,
    validated: true,
    popularity: 76,
    sourceUrl: 'https://github.com/github/mcp-repos',
    schema: `{
  "name": "github.repos",
  "version": "1.5.0",
  "tools": [
    {
      "name": "list_repositories",
      "description": "List user repositories",
      "parameters": {
        "username": "string",
        "type": "string"
      }
    }
  ]
}`,
    compatibleModels: ['GPT-4', 'Claude-3', 'Gemini Pro', 'Llama-2']
  },
  {
    id: '4',
    name: 'slack.workspace',
    description: 'Slack workspace integration for team communication and automation',
    tags: ['Communication', 'Team', 'Automation'],
    domain: 'productivity',
    featured: false,
    validated: true,
    popularity: 82,
    sourceUrl: 'https://github.com/slack/mcp-workspace',
    schema: `{
  "name": "slack.workspace",
  "version": "1.2.0",
  "tools": [
    {
      "name": "send_message",
      "description": "Send message to channel",
      "parameters": {
        "channel": "string",
        "text": "string",
        "thread_ts": "string"
      }
    }
  ]
}`,
    compatibleModels: ['GPT-4', 'Claude-3']
  },
  {
    id: '5',
    name: 'weather.forecast',
    description: 'Real-time weather data and forecasting with global coverage',
    tags: ['Weather', 'API', 'Data'],
    domain: 'data',
    featured: false,
    validated: false,
    popularity: 64,
    sourceUrl: 'https://github.com/weather/mcp-forecast',
    schema: `{
  "name": "weather.forecast",
  "version": "0.9.0",
  "tools": [
    {
      "name": "get_current_weather",
      "description": "Get current weather for location",
      "parameters": {
        "location": "string",
        "units": "string"
      }
    }
  ]
}`,
    compatibleModels: ['GPT-4', 'Claude-3', 'Gemini Pro']
  },
  {
    id: '6',
    name: 'calendar.events',
    description: 'Calendar management with Google Calendar and Outlook integration',
    tags: ['Calendar', 'Productivity', 'Integration'],
    domain: 'productivity',
    featured: true,
    validated: true,
    popularity: 71,
    sourceUrl: 'https://github.com/calendar/mcp-events',
    schema: `{
  "name": "calendar.events",
  "version": "1.3.0",
  "tools": [
    {
      "name": "create_event",
      "description": "Create a new calendar event",
      "parameters": {
        "title": "string",
        "start_time": "datetime",
        "end_time": "datetime",
        "attendees": "array"
      }
    }
  ]
}`,
    compatibleModels: ['GPT-4', 'Claude-3', 'Gemini Pro']
  }
];

export const ExploreView: React.FC<ExploreViewProps> = ({ isDark }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedMCP, setSelectedMCP] = useState<MCP | null>(null);

  const domains = ['all', 'travel', 'finance', 'development', 'productivity', 'data'];

  const filteredMCPs = mockMCPs
    .filter(mcp => {
      const matchesSearch = mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mcp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mcp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDomain = selectedDomain === 'all' || mcp.domain === selectedDomain;
      return matchesSearch && matchesDomain;
    })
    .sort((a, b) => {
      if (sortBy === 'popularity') return b.popularity - a.popularity;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

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
    <motion.div 
      className="container mx-auto px-6 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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
              Explore Public MCPs
            </h1>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Discover and integrate Model Context Protocols from the community
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="🔍 Search MCPs (e.g., airbnb.bookings)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
            />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
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
          </select>
        </div>

        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {filteredMCPs.length} MCPs found
        </div>
      </motion.div>

      {/* MCP Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {filteredMCPs.map((mcp) => (
          <motion.div
            key={mcp.id}
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
                  {mcp.featured && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                  {mcp.validated && (
                    <Shield className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  {mcp.description}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {mcp.tags.map((tag, index) => (
                <span
                  key={index}
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
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{mcp.popularity}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>{mcp.compatibleModels.length} models</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
              >
                <Play className="w-4 h-4" />
                <span>Try in Playground</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-xl border transition-all duration-300 ${
                  isDark 
                    ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                    : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                }`}
              >
                <Download className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>

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
                      {selectedMCP.featured && (
                        <Star className="w-6 h-6 text-yellow-500 fill-current" />
                      )}
                      {selectedMCP.validated && (
                        <Shield className="w-6 h-6 text-green-500" />
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
                      Popularity
                    </h4>
                    <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {selectedMCP.popularity}%
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Compatible Models
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedMCP.compatibleModels.join(', ')}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Source
                    </h4>
                    <a
                      href={selectedMCP.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-400 text-sm break-all"
                    >
                      {selectedMCP.sourceUrl}
                    </a>
                  </div>
                </div>

                {/* Schema */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <Code className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Schema
                    </h4>
                  </div>
                  <div className={`p-4 rounded-xl border ${
                    isDark 
                      ? 'bg-gray-900/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <pre className={`text-sm overflow-x-auto ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {selectedMCP.schema}
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                    <span>Try in Playground</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500' 
                        : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                    }`}
                  >
                    <Download className="w-5 h-5" />
                    <span>Import MCP</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};