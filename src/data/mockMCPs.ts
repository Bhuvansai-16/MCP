export interface MCPListItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  domain: string;
  validated: boolean;
  popularity: number;
  source_url?: string;
  source_platform: string;
  confidence_score: number;
  file_type: string;
  repository?: string;
  stars: number;
  created_at: string;
}

export interface WebMCPResult {
  name: string;
  description: string;
  source_url: string;
  tags: string[];
  domain: string;
  validated: boolean;
  schema?: Record<string, any>;
  file_type: string;
  repository?: string;
  stars?: number;
  source_platform: string;
  confidence_score: number;
}

export const mockLocalMCPs: MCPListItem[] = [
  {
    id: "weather-001",
    name: "weather-forecast",
    description: "Real-time weather data and forecasting with global coverage",
    tags: ["weather", "forecast", "api"],
    domain: "weather",
    validated: true,
    popularity: 95,
    source_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/weather",
    source_platform: "github",
    confidence_score: 0.95,
    file_type: "typescript",
    repository: "modelcontextprotocol/servers",
    stars: 1250,
    created_at: new Date().toISOString()
  },
  {
    id: "filesystem-002",
    name: "filesystem-operations",
    description: "Secure file system operations with read/write capabilities",
    tags: ["filesystem", "files", "io"],
    domain: "development",
    validated: true,
    popularity: 88,
    source_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    source_platform: "github",
    confidence_score: 0.92,
    file_type: "typescript",
    repository: "modelcontextprotocol/servers",
    stars: 1250,
    created_at: new Date().toISOString()
  },
  {
    id: "ecommerce-003",
    name: "ecommerce-store",
    description: "Complete e-commerce functionality with product management",
    tags: ["ecommerce", "shopping", "products"],
    domain: "ecommerce",
    validated: true,
    popularity: 82,
    source_url: "https://github.com/example/ecommerce-mcp",
    source_platform: "github",
    confidence_score: 0.88,
    file_type: "json",
    repository: "example/ecommerce-mcp",
    stars: 456,
    created_at: new Date().toISOString()
  },
  {
    id: "calendar-004",
    name: "calendar-events",
    description: "Calendar management with Google Calendar integration",
    tags: ["calendar", "events", "scheduling"],
    domain: "productivity",
    validated: true,
    popularity: 76,
    source_url: "https://github.com/example/calendar-mcp",
    source_platform: "github",
    confidence_score: 0.85,
    file_type: "yaml",
    repository: "example/calendar-mcp",
    stars: 234,
    created_at: new Date().toISOString()
  },
  {
    id: "social-005",
    name: "social-media",
    description: "Social media posting and management tools",
    tags: ["social", "posting", "media"],
    domain: "social",
    validated: true,
    popularity: 71,
    source_url: "https://github.com/example/social-mcp",
    source_platform: "github",
    confidence_score: 0.82,
    file_type: "json",
    repository: "example/social-mcp",
    stars: 189,
    created_at: new Date().toISOString()
  },
  {
    id: "travel-006",
    name: "travel-booking",
    description: "Travel booking and itinerary management",
    tags: ["travel", "booking", "hotels"],
    domain: "travel",
    validated: true,
    popularity: 68,
    source_url: "https://github.com/example/travel-mcp",
    source_platform: "github",
    confidence_score: 0.79,
    file_type: "json",
    repository: "example/travel-mcp",
    stars: 167,
    created_at: new Date().toISOString()
  },
  {
    id: "finance-007",
    name: "finance-tracker",
    description: "Personal finance tracking and analysis",
    tags: ["finance", "tracking", "analysis"],
    domain: "finance",
    validated: true,
    popularity: 65,
    source_url: "https://github.com/example/finance-mcp",
    source_platform: "github",
    confidence_score: 0.76,
    file_type: "yaml",
    repository: "example/finance-mcp",
    stars: 145,
    created_at: new Date().toISOString()
  },
  {
    id: "ai-008",
    name: "ai-assistant",
    description: "AI-powered assistant with multiple capabilities",
    tags: ["ai", "assistant", "automation"],
    domain: "ai",
    validated: true,
    popularity: 62,
    source_url: "https://github.com/example/ai-mcp",
    source_platform: "github",
    confidence_score: 0.73,
    file_type: "json",
    repository: "example/ai-mcp",
    stars: 123,
    created_at: new Date().toISOString()
  },
  {
    id: "scraping-009",
    name: "web-scraping-tools",
    description: "Advanced web scraping tools with proxy support and rate limiting",
    tags: ["scraping", "web", "data", "extraction"],
    domain: "development",
    validated: true,
    popularity: 78,
    source_url: "https://github.com/scraping-tools/web-mcp",
    source_platform: "github",
    confidence_score: 0.87,
    file_type: "json",
    repository: "scraping-tools/web-mcp",
    stars: 342,
    created_at: new Date().toISOString()
  },
  {
    id: "database-010",
    name: "database-connector",
    description: "Universal database connector supporting multiple database types",
    tags: ["database", "sql", "connector", "mysql", "postgres"],
    domain: "development",
    validated: true,
    popularity: 84,
    source_url: "https://github.com/db-tools/universal-mcp",
    source_platform: "github",
    confidence_score: 0.91,
    file_type: "typescript",
    repository: "db-tools/universal-mcp",
    stars: 567,
    created_at: new Date().toISOString()
  },
  // NEW MCPs - Adding 10 more for enhanced user experience
  {
    id: "image-011",
    name: "image-processing",
    description: "Advanced image manipulation, analysis, and AI-powered enhancement tools",
    tags: ["image", "vision", "ai", "processing", "enhancement"],
    domain: "ai",
    validated: true,
    popularity: 89,
    source_url: "https://github.com/image-tools/mcp-suite",
    source_platform: "github",
    confidence_score: 0.90,
    file_type: "json",
    repository: "image-tools/mcp-suite",
    stars: 678,
    created_at: new Date().toISOString()
  },
  {
    id: "nlp-012",
    name: "nlp-toolkit",
    description: "Comprehensive natural language processing with sentiment analysis and translation",
    tags: ["nlp", "text", "language", "ai", "sentiment", "translation"],
    domain: "ai",
    validated: true,
    popularity: 86,
    source_url: "https://github.com/nlp-solutions/mcp-toolkit",
    source_platform: "github",
    confidence_score: 0.93,
    file_type: "yaml",
    repository: "nlp-solutions/mcp-toolkit",
    stars: 892,
    created_at: new Date().toISOString()
  },
  {
    id: "project-013",
    name: "project-manager",
    description: "Automated project planning, task management, and team collaboration tools",
    tags: ["project", "management", "tasks", "productivity", "collaboration"],
    domain: "productivity",
    validated: true,
    popularity: 74,
    source_url: "https://github.com/pm-tools/mcp-suite",
    source_platform: "github",
    confidence_score: 0.81,
    file_type: "json",
    repository: "pm-tools/mcp-suite",
    stars: 445,
    created_at: new Date().toISOString()
  },
  {
    id: "health-014",
    name: "medical-info",
    description: "Healthcare information management with appointment scheduling and health tracking",
    tags: ["healthcare", "medical", "health", "appointments", "tracking"],
    domain: "general",
    validated: true,
    popularity: 67,
    source_url: "https://github.com/health-tech/mcp-medical",
    source_platform: "github",
    confidence_score: 0.78,
    file_type: "yaml",
    repository: "health-tech/mcp-medical",
    stars: 234,
    created_at: new Date().toISOString()
  },
  {
    id: "crypto-015",
    name: "crypto-portfolio",
    description: "Cryptocurrency portfolio management with real-time tracking and analytics",
    tags: ["crypto", "portfolio", "trading", "blockchain", "analytics"],
    domain: "finance",
    validated: true,
    popularity: 81,
    source_url: "https://github.com/crypto-tools/portfolio-mcp",
    source_platform: "github",
    confidence_score: 0.85,
    file_type: "typescript",
    repository: "crypto-tools/portfolio-mcp",
    stars: 567,
    created_at: new Date().toISOString()
  },
  {
    id: "iot-016",
    name: "smart-home-hub",
    description: "IoT device control and smart home automation with energy optimization",
    tags: ["iot", "smart-home", "automation", "energy", "devices"],
    domain: "productivity",
    validated: true,
    popularity: 73,
    source_url: "https://github.com/iot-home/smart-hub-mcp",
    source_platform: "github",
    confidence_score: 0.83,
    file_type: "json",
    repository: "iot-home/smart-hub-mcp",
    stars: 389,
    created_at: new Date().toISOString()
  },
  {
    id: "email-017",
    name: "email-automation",
    description: "Advanced email automation with templates, scheduling, and analytics",
    tags: ["email", "automation", "templates", "scheduling", "analytics"],
    domain: "productivity",
    validated: true,
    popularity: 79,
    source_url: "https://github.com/email-tools/automation-mcp",
    source_platform: "github",
    confidence_score: 0.87,
    file_type: "yaml",
    repository: "email-tools/automation-mcp",
    stars: 456,
    created_at: new Date().toISOString()
  },
  {
    id: "content-018",
    name: "content-generator",
    description: "AI-powered content creation for blogs, social media, and marketing materials",
    tags: ["content", "ai", "generation", "marketing", "writing"],
    domain: "ai",
    validated: true,
    popularity: 85,
    source_url: "https://github.com/content-ai/generator-mcp",
    source_platform: "github",
    confidence_score: 0.89,
    file_type: "json",
    repository: "content-ai/generator-mcp",
    stars: 723,
    created_at: new Date().toISOString()
  },
  {
    id: "security-019",
    name: "security-scanner",
    description: "Comprehensive security scanning and vulnerability assessment tools",
    tags: ["security", "scanning", "vulnerability", "assessment", "cybersecurity"],
    domain: "development",
    validated: true,
    popularity: 77,
    source_url: "https://github.com/security-tools/scanner-mcp",
    source_platform: "github",
    confidence_score: 0.86,
    file_type: "typescript",
    repository: "security-tools/scanner-mcp",
    stars: 512,
    created_at: new Date().toISOString()
  },
  {
    id: "analytics-020",
    name: "data-analytics",
    description: "Advanced data analytics and visualization with machine learning insights",
    tags: ["analytics", "data", "visualization", "ml", "insights"],
    domain: "ai",
    validated: true,
    popularity: 83,
    source_url: "https://github.com/data-tools/analytics-mcp",
    source_platform: "github",
    confidence_score: 0.91,
    file_type: "json",
    repository: "data-tools/analytics-mcp",
    stars: 634,
    created_at: new Date().toISOString()
  }
];

export const mockWebMCPs: WebMCPResult[] = [
  {
    name: "advanced-weather-api",
    description: "Advanced weather API with machine learning predictions and climate analysis",
    source_url: "https://github.com/weather-ml/advanced-mcp",
    tags: ["weather", "ml", "predictions", "climate"],
    domain: "weather",
    validated: true,
    schema: {
      name: "advanced-weather-api",
      version: "2.0.0",
      tools: [
        { name: "get_weather_ml", description: "Get ML-enhanced weather data" },
        { name: "predict_weather", description: "Predict weather patterns using AI" },
        { name: "climate_analysis", description: "Analyze long-term climate trends" }
      ]
    },
    file_type: "json",
    repository: "weather-ml/advanced-mcp",
    stars: 892,
    source_platform: "github",
    confidence_score: 0.94
  },
  {
    name: "crypto-trading-bot",
    description: "Cryptocurrency trading automation with risk management and portfolio optimization",
    source_url: "https://github.com/crypto-tools/trading-mcp",
    tags: ["crypto", "trading", "automation", "portfolio"],
    domain: "finance",
    validated: true,
    schema: {
      name: "crypto-trading-bot",
      version: "1.5.0",
      tools: [
        { name: "execute_trade", description: "Execute cryptocurrency trades" },
        { name: "analyze_market", description: "Analyze market conditions" },
        { name: "manage_portfolio", description: "Optimize portfolio allocation" }
      ]
    },
    file_type: "yaml",
    repository: "crypto-tools/trading-mcp",
    stars: 567,
    source_platform: "github",
    confidence_score: 0.89
  },
  {
    name: "smart-home-controller",
    description: "IoT device control and automation for smart homes with energy optimization",
    source_url: "https://github.com/iot-home/smart-mcp",
    tags: ["iot", "smart-home", "automation", "energy"],
    domain: "productivity",
    validated: true,
    schema: {
      name: "smart-home-controller",
      version: "3.1.0",
      tools: [
        { name: "control_lights", description: "Control smart lighting systems" },
        { name: "manage_temperature", description: "Manage thermostat and HVAC" },
        { name: "optimize_energy", description: "Optimize energy consumption" }
      ]
    },
    file_type: "json",
    repository: "iot-home/smart-mcp",
    stars: 423,
    source_platform: "github",
    confidence_score: 0.87
  },
  {
    name: "content-scraper-pro",
    description: "Professional web scraping with JavaScript rendering and anti-detection",
    source_url: "https://github.com/scraping-pro/content-mcp",
    tags: ["scraping", "web", "javascript", "anti-detection"],
    domain: "development",
    validated: true,
    schema: {
      name: "content-scraper-pro",
      version: "2.3.0",
      tools: [
        { name: "scrape_page", description: "Scrape web page content" },
        { name: "render_js", description: "Render JavaScript-heavy pages" },
        { name: "bypass_detection", description: "Bypass anti-scraping measures" }
      ]
    },
    file_type: "typescript",
    repository: "scraping-pro/content-mcp",
    stars: 734,
    source_platform: "github",
    confidence_score: 0.91
  },
  {
    name: "email-automation-suite",
    description: "Comprehensive email automation with templates and analytics",
    source_url: "https://github.com/email-tools/automation-mcp",
    tags: ["email", "automation", "templates", "analytics"],
    domain: "productivity",
    validated: true,
    schema: {
      name: "email-automation-suite",
      version: "1.8.0",
      tools: [
        { name: "send_email", description: "Send automated emails" },
        { name: "create_template", description: "Create email templates" },
        { name: "track_analytics", description: "Track email performance" }
      ]
    },
    file_type: "json",
    repository: "email-tools/automation-mcp",
    stars: 445,
    source_platform: "github",
    confidence_score: 0.83
  },
  {
    name: "awesome-api-collection",
    description: "Curated collection of API integrations from awesome-apis list",
    source_url: "https://github.com/awesome-apis/mcp-collection",
    tags: ["awesome", "api", "collection", "integration"],
    domain: "development",
    validated: true,
    schema: {
      name: "awesome-api-collection",
      version: "1.0.0",
      tools: [
        { name: "call_api", description: "Make API calls to various services" },
        { name: "authenticate", description: "Handle API authentication" },
        { name: "rate_limit", description: "Manage API rate limiting" }
      ]
    },
    file_type: "json",
    repository: "awesome-apis/mcp-collection",
    stars: 1123,
    source_platform: "github",
    confidence_score: 0.96
  }
];