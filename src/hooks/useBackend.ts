import { useState } from 'react';
import { webScraperService, ScrapedMCP } from '../services/webScraper';

export interface MCPSchema {
  name: string;
  version: string;
  description?: string;
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

export interface AgentRequest {
  prompt: string;
  document?: string;
  mcp_schema: MCPSchema;
}

export interface ToolCall {
  tool: string;
  input: Record<string, any>;
  output: Record<string, any>;
  latency_ms: number;
  tokens_used: number;
}

export interface AgentResponse {
  output: string;
  tool_calls: ToolCall[];
  tokens_used: number;
  latency_ms: number;
  model_used: string;
  session_id: string;
}

export interface CompareRequest {
  prompt: string;
  document?: string;
  protocols: string[];
}

export interface ProtocolResult {
  protocol: string;
  response: string;
  latency_ms: number;
  tokens_used: number;
  quality_score: number;
}

export interface CompareResponse {
  results: ProtocolResult[];
  total_latency_ms: number;
  comparison_id: string;
}

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

// Mock local MCPs data
const mockLocalMCPs: MCPListItem[] = [
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
  }
];

export const useBackend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAgent = async (request: AgentRequest): Promise<AgentResponse> => {
    // Mock implementation for demo
    const sessionId = `session_${Date.now()}`;
    const startTime = Date.now();

    // Simulate tool execution
    const toolCalls: ToolCall[] = [];
    const promptLower = request.prompt.toLowerCase();

    for (const tool of request.mcp_schema.tools) {
      const toolName = tool.name.toLowerCase();
      if (promptLower.includes(toolName) || 
          promptLower.includes('weather') && toolName.includes('weather') ||
          promptLower.includes('search') && toolName.includes('search')) {
        
        const mockOutput = {
          tool: tool.name,
          result: `Mock result from ${tool.name}`,
          success: true
        };

        toolCalls.push({
          tool: tool.name,
          input: { query: request.prompt.slice(0, 50) },
          output: mockOutput,
          latency_ms: Math.floor(Math.random() * 500) + 100,
          tokens_used: Math.floor(Math.random() * 100) + 50
        });
      }
    }

    const agentOutput = toolCalls.length > 0 
      ? `I've executed ${toolCalls.length} tool(s) to help with your request: ${toolCalls.map(t => t.tool).join(', ')}`
      : `I understand your request but don't have suitable tools available in the current MCP schema.`;

    return {
      output: agentOutput,
      tool_calls: toolCalls,
      tokens_used: toolCalls.reduce((sum, call) => sum + call.tokens_used, 0) + 100,
      latency_ms: Date.now() - startTime,
      model_used: 'mcp-simulator',
      session_id: sessionId
    };
  };

  const compareProtocols = async (request: CompareRequest): Promise<CompareResponse> => {
    // Mock implementation
    const mockResults: ProtocolResult[] = request.protocols.map(protocol => ({
      protocol,
      response: `Mock response from ${protocol} protocol analyzing: ${request.prompt.substring(0, 100)}...`,
      latency_ms: Math.floor(Math.random() * 2000) + 500,
      tokens_used: Math.floor(Math.random() * 800) + 200,
      quality_score: Math.floor(Math.random() * 3) + 7
    }));

    return {
      results: mockResults,
      total_latency_ms: mockResults.reduce((sum, r) => sum + r.latency_ms, 0),
      comparison_id: `comp_${Date.now()}`
    };
  };

  const getMCPs = async (params: {
    domain?: string;
    tags?: string;
    validated?: boolean;
    sort_by?: string;
    limit?: number;
    min_confidence?: number;
  } = {}): Promise<MCPListItem[]> => {
    setLoading(true);
    setError(null);

    try {
      // Filter mock data based on parameters
      let filteredMCPs = [...mockLocalMCPs];

      if (params.domain && params.domain !== 'all') {
        filteredMCPs = filteredMCPs.filter(mcp => mcp.domain === params.domain);
      }

      if (params.tags) {
        filteredMCPs = filteredMCPs.filter(mcp => 
          mcp.tags.some(tag => tag.toLowerCase().includes(params.tags!.toLowerCase()))
        );
      }

      if (params.validated !== undefined) {
        filteredMCPs = filteredMCPs.filter(mcp => mcp.validated === params.validated);
      }

      if (params.min_confidence !== undefined) {
        filteredMCPs = filteredMCPs.filter(mcp => mcp.confidence_score >= params.min_confidence!);
      }

      // Sort results
      if (params.sort_by === 'name') {
        filteredMCPs.sort((a, b) => a.name.localeCompare(b.name));
      } else if (params.sort_by === 'confidence_score') {
        filteredMCPs.sort((a, b) => b.confidence_score - a.confidence_score);
      } else {
        filteredMCPs.sort((a, b) => b.popularity - a.popularity);
      }

      // Apply limit
      if (params.limit) {
        filteredMCPs = filteredMCPs.slice(0, params.limit);
      }

      return filteredMCPs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch MCPs';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchWebMCPs = async (
    query: string, 
    limit: number = 20,
    options: {
      sources?: string;
      min_confidence?: number;
      use_scraping?: boolean;
    } = {}
  ): Promise<WebMCPResult[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Starting web search for: ${query} with Playwright scraping`);
      
      if (!options.use_scraping) {
        // Return empty results if scraping is disabled
        return [];
      }

      // Use Playwright web scraper
      const results = await webScraperService.searchAll(query, limit);
      
      // Filter by confidence if specified
      const filteredResults = options.min_confidence 
        ? results.filter(r => r.confidence_score >= options.min_confidence!)
        : results;

      console.log(`Web search completed: ${filteredResults.length} results found`);
      return filteredResults;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Web search failed';
      setError(errorMessage);
      console.error('Web search error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const enhancedSearchMCPs = async (request: {
    query: string;
    limit?: number;
    sources?: string[];
    min_confidence?: number;
    domains?: string[];
    use_web_scraping?: boolean;
  }): Promise<WebMCPResult[]> => {
    return searchWebMCPs(request.query, request.limit, {
      sources: request.sources?.join(','),
      min_confidence: request.min_confidence,
      use_scraping: request.use_web_scraping
    });
  };

  const importMCPFromWeb = async (sourceUrl: string, autoValidate: boolean = true): Promise<{
    id: string;
    message: string;
    name: string;
    source_url: string;
    validated: boolean;
    domain: string;
    tags: string[];
  }> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch and validate the MCP from the URL
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch MCP: ${response.statusText}`);
      }

      const content = await response.text();
      let data: any;

      try {
        data = JSON.parse(content);
      } catch {
        const yaml = await import('js-yaml');
        data = yaml.load(content);
      }

      // Basic validation
      if (!data.name || !data.tools) {
        throw new Error('Invalid MCP structure');
      }

      const newMCP: MCPListItem = {
        id: `imported-${Date.now()}`,
        name: data.name,
        description: data.description || `Imported from ${sourceUrl}`,
        tags: data.tags || ['imported'],
        domain: 'general',
        validated: autoValidate,
        popularity: 50,
        source_url: sourceUrl,
        source_platform: 'web',
        confidence_score: 0.8,
        file_type: sourceUrl.endsWith('.yaml') || sourceUrl.endsWith('.yml') ? 'yaml' : 'json',
        repository: undefined,
        stars: 0,
        created_at: new Date().toISOString()
      };

      // Add to mock data (in a real app, this would be saved to a database)
      mockLocalMCPs.unshift(newMCP);

      return {
        id: newMCP.id,
        message: `Successfully imported ${data.name}`,
        name: data.name,
        source_url: sourceUrl,
        validated: autoValidate,
        domain: newMCP.domain,
        tags: newMCP.tags
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const healthCheck = async (): Promise<{ 
    status: string; 
    timestamp: string; 
    database: string;
    features: string[];
    version: string;
    scraping_enabled: boolean;
    supported_platforms: string[];
  }> => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      features: ['web_scraping', 'mcp_validation', 'playwright_integration'],
      version: '3.0.0',
      scraping_enabled: true,
      supported_platforms: ['GitHub', 'General Web', 'Awesome Lists']
    };
  };

  // Cleanup function to close browser when component unmounts
  const cleanup = async () => {
    await webScraperService.cleanup();
  };

  return {
    loading,
    error,
    runAgent,
    compareProtocols,
    getMCPs,
    searchWebMCPs,
    enhancedSearchMCPs,
    importMCPFromWeb,
    healthCheck,
    cleanup,
    BACKEND_URL: 'client-side-scraping',
  };
};