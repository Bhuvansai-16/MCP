import { useState } from 'react';

// Mock backend for demo purposes
const MOCK_BACKEND = true;

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

// Demo MCP data based on official MCP GitHub repositories
const DEMO_MCPS: MCPListItem[] = [
  {
    id: 'mcp-weather-001',
    name: 'weather-forecast',
    description: 'Real-time weather data and forecasting with global coverage and severe weather alerts',
    tags: ['weather', 'api', 'forecast', 'alerts'],
    domain: 'weather',
    validated: true,
    popularity: 95,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/weather',
    source_platform: 'github',
    confidence_score: 0.95,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'mcp-filesystem-002',
    name: 'filesystem-operations',
    description: 'Secure file system operations with read/write capabilities and directory management',
    tags: ['filesystem', 'files', 'directories', 'io'],
    domain: 'development',
    validated: true,
    popularity: 88,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    source_platform: 'github',
    confidence_score: 0.92,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-14').toISOString(),
  },
  {
    id: 'mcp-memory-003',
    name: 'memory-storage',
    description: 'Persistent memory storage for maintaining context across conversations',
    tags: ['memory', 'storage', 'context', 'persistence'],
    domain: 'ai',
    validated: true,
    popularity: 82,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    source_platform: 'github',
    confidence_score: 0.89,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-13').toISOString(),
  },
  {
    id: 'mcp-fetch-004',
    name: 'web-fetch',
    description: 'HTTP client for fetching web content with support for various formats',
    tags: ['http', 'web', 'fetch', 'client'],
    domain: 'web',
    validated: true,
    popularity: 76,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    source_platform: 'github',
    confidence_score: 0.87,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-12').toISOString(),
  },
  {
    id: 'mcp-sqlite-005',
    name: 'sqlite-database',
    description: 'SQLite database operations with query execution and schema management',
    tags: ['database', 'sqlite', 'sql', 'queries'],
    domain: 'data',
    validated: true,
    popularity: 79,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
    source_platform: 'github',
    confidence_score: 0.91,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-11').toISOString(),
  },
  {
    id: 'mcp-github-006',
    name: 'github-integration',
    description: 'GitHub API integration for repository management and issue tracking',
    tags: ['github', 'git', 'repositories', 'issues'],
    domain: 'development',
    validated: true,
    popularity: 85,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    source_platform: 'github',
    confidence_score: 0.93,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'mcp-slack-007',
    name: 'slack-connector',
    description: 'Slack workspace integration for messaging and channel management',
    tags: ['slack', 'messaging', 'communication', 'workspace'],
    domain: 'communication',
    validated: true,
    popularity: 71,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    source_platform: 'github',
    confidence_score: 0.84,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-09').toISOString(),
  },
  {
    id: 'mcp-postgres-008',
    name: 'postgresql-client',
    description: 'PostgreSQL database client with advanced query capabilities',
    tags: ['postgresql', 'database', 'sql', 'client'],
    domain: 'data',
    validated: true,
    popularity: 83,
    source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    source_platform: 'github',
    confidence_score: 0.90,
    file_type: 'typescript',
    repository: 'modelcontextprotocol/servers',
    stars: 1250,
    created_at: new Date('2024-01-08').toISOString(),
  }
];

// Mock tool implementations
async function executeWeatherTool(location: string, units: string = 'metric') {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  const mockData: Record<string, any> = {
    'paris': { temp: 22, condition: 'Sunny', humidity: 65 },
    'london': { temp: 18, condition: 'Cloudy', humidity: 78 },
    'new york': { temp: 25, condition: 'Partly Cloudy', humidity: 60 },
    'tokyo': { temp: 28, condition: 'Rainy', humidity: 85 },
    'san francisco': { temp: 19, condition: 'Foggy', humidity: 72 }
  };
  
  const locationKey = location.toLowerCase();
  const data = mockData[locationKey] || { temp: 20, condition: 'Unknown', humidity: 50 };
  
  return {
    location,
    temperature: data.temp,
    condition: data.condition,
    humidity: data.humidity,
    units,
    timestamp: new Date().toISOString()
  };
}

async function executeSearchTool(query: string, limit: number = 5) {
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  
  const mockResults = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
    title: `Search result for "${query}" - Article ${i + 1}`,
    url: `https://example.com/article-${i + 1}`,
    snippet: `This is a mock search result snippet for ${query}. It contains relevant information about the topic.`,
    relevance: Math.random() * 0.3 + 0.7
  }));
  
  return {
    query,
    results: mockResults,
    total: mockResults.length,
    search_time_ms: Math.floor(Math.random() * 200) + 100
  };
}

async function executeFilesystemTool(operation: string, path: string, content?: string) {
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  switch (operation) {
    case 'read':
      return {
        operation,
        path,
        content: `Mock file content from ${path}`,
        size: Math.floor(Math.random() * 10000) + 1000,
        modified: new Date().toISOString()
      };
    case 'write':
      return {
        operation,
        path,
        bytes_written: content?.length || 0,
        success: true
      };
    case 'list':
      return {
        operation,
        path,
        files: [
          { name: 'file1.txt', type: 'file', size: 1024 },
          { name: 'file2.json', type: 'file', size: 2048 },
          { name: 'subfolder', type: 'directory', size: 0 }
        ]
      };
    default:
      return {
        operation,
        path,
        error: 'Unknown operation'
      };
  }
}

async function executeGenericTool(toolName: string, parameters: Record<string, any>) {
  await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));
  
  return {
    tool: toolName,
    input: parameters,
    result: `Mock result from ${toolName}`,
    success: true,
    timestamp: new Date().toISOString()
  };
}

async function executeTool(toolName: string, parameters: Record<string, any>): Promise<any> {
  const lowerToolName = toolName.toLowerCase();
  
  if (lowerToolName.includes('weather')) {
    return executeWeatherTool(
      parameters.location || 'Unknown',
      parameters.units || 'metric'
    );
  }
  
  if (lowerToolName.includes('search')) {
    return executeSearchTool(
      parameters.query || '',
      parameters.limit || 5
    );
  }
  
  if (lowerToolName.includes('file') || lowerToolName.includes('filesystem')) {
    return executeFilesystemTool(
      parameters.operation || 'read',
      parameters.path || '/tmp/example.txt',
      parameters.content
    );
  }
  
  return executeGenericTool(toolName, parameters);
}

function generateMockParameters(tool: any, userPrompt: string): Record<string, any> {
  const params: Record<string, any> = {};
  const promptLower = userPrompt.toLowerCase();
  
  // Extract parameters based on tool definition and user prompt
  Object.entries(tool.parameters || {}).forEach(([paramName, paramType]) => {
    switch (paramName) {
      case 'location':
        // Try to extract location from prompt
        const locationMatch = promptLower.match(/(?:in|for|at)\s+([a-zA-Z\s]+?)(?:\s|$|[.!?])/);
        params[paramName] = locationMatch ? locationMatch[1].trim() : 'San Francisco';
        break;
      case 'query':
        // Use part of the prompt as query
        params[paramName] = userPrompt.slice(0, 50);
        break;
      case 'units':
        params[paramName] = promptLower.includes('celsius') ? 'metric' : 'imperial';
        break;
      case 'limit':
        params[paramName] = 5;
        break;
      case 'operation':
        if (promptLower.includes('read')) params[paramName] = 'read';
        else if (promptLower.includes('write')) params[paramName] = 'write';
        else if (promptLower.includes('list')) params[paramName] = 'list';
        else params[paramName] = 'read';
        break;
      case 'path':
        params[paramName] = '/tmp/example.txt';
        break;
      default:
        // Generate mock value based on type
        if (typeof paramType === 'string') {
          switch (paramType) {
            case 'string':
              params[paramName] = `sample_${paramName}`;
              break;
            case 'number':
              params[paramName] = Math.floor(Math.random() * 100);
              break;
            case 'boolean':
              params[paramName] = Math.random() > 0.5;
              break;
            default:
              params[paramName] = `sample_${paramName}`;
          }
        }
    }
  });
  
  return params;
}

function generateAgentResponse(prompt: string, toolCalls: ToolCall[], mcpSchema: any): string {
  if (toolCalls.length === 0) {
    return `I understand you're asking about "${prompt}". However, I don't have the right tools available in the current MCP to help with that specific request. The available tools are: ${mcpSchema.tools.map((t: any) => t.name).join(', ')}.`;
  }

  let response = `I've processed your request using the following tools:\n\n`;
  
  toolCalls.forEach(call => {
    response += `🔧 **${call.tool}**: `;
    
    if (call.tool.toLowerCase().includes('weather')) {
      const output = call.output;
      response += `The weather in ${output.location} is ${output.temperature}°C and ${output.condition} with ${output.humidity}% humidity.\n`;
    } else if (call.tool.toLowerCase().includes('search')) {
      const output = call.output;
      response += `Found ${output.total} results for "${output.query}" in ${output.search_time_ms}ms.\n`;
    } else if (call.tool.toLowerCase().includes('file')) {
      const output = call.output;
      response += `File operation "${output.operation}" completed successfully for ${output.path}.\n`;
    } else {
      response += `Executed successfully with result: ${JSON.stringify(call.output).substring(0, 100)}...\n`;
    }
  });

  response += `\nIs there anything else you'd like me to help you with using the available MCP tools?`;
  return response;
}

export const useBackend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAgent = async (request: AgentRequest): Promise<AgentResponse> => {
    setLoading(true);
    setError(null);

    try {
      const { prompt, document, mcp_schema } = request;
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();

      // Determine which tools to use based on prompt content
      const toolCalls: ToolCall[] = [];
      const promptLower = prompt.toLowerCase();

      for (const tool of mcp_schema.tools) {
        const toolName = tool.name.toLowerCase();
        let shouldUseTool = false;

        // Simple keyword matching
        if (toolName.includes('weather') && (promptLower.includes('weather') || promptLower.includes('temperature'))) {
          shouldUseTool = true;
        } else if (toolName.includes('search') && (promptLower.includes('search') || promptLower.includes('find'))) {
          shouldUseTool = true;
        } else if (toolName.includes('file') && (promptLower.includes('file') || promptLower.includes('read') || promptLower.includes('write'))) {
          shouldUseTool = true;
        } else if (promptLower.includes(toolName) || promptLower.includes(tool.description.toLowerCase().split(' ')[0])) {
          shouldUseTool = true;
        }

        if (shouldUseTool) {
          const toolStartTime = Date.now();
          const mockParams = generateMockParameters(tool, prompt);
          const toolOutput = await executeTool(tool.name, mockParams);
          const toolLatency = Date.now() - toolStartTime;
          const toolTokens = Math.floor(JSON.stringify(toolOutput).length / 4);

          toolCalls.push({
            tool: tool.name,
            input: mockParams,
            output: toolOutput,
            latency_ms: toolLatency,
            tokens_used: toolTokens
          });
        }
      }

      const agentOutput = generateAgentResponse(prompt, toolCalls, mcp_schema);
      const totalLatency = Date.now() - startTime;
      const totalTokens = toolCalls.reduce((sum, call) => sum + call.tokens_used, 0) + Math.floor(agentOutput.length / 4);

      return {
        output: agentOutput,
        tool_calls: toolCalls,
        tokens_used: totalTokens,
        latency_ms: totalLatency,
        model_used: 'mcp-simulator',
        session_id: sessionId
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Agent execution failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const compareProtocols = async (request: CompareRequest): Promise<CompareResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Mock implementation for protocol comparison
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Protocol comparison failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
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
      let filteredMCPs = [...DEMO_MCPS];

      // Apply filters
      if (params.domain && params.domain !== 'all') {
        filteredMCPs = filteredMCPs.filter(mcp => mcp.domain === params.domain);
      }

      if (params.tags) {
        const tagList = params.tags.split(',').map(tag => tag.trim().toLowerCase());
        filteredMCPs = filteredMCPs.filter(mcp => 
          mcp.tags.some(tag => tagList.includes(tag.toLowerCase()))
        );
      }

      if (params.validated !== undefined) {
        filteredMCPs = filteredMCPs.filter(mcp => mcp.validated === params.validated);
      }

      // Apply sorting
      switch (params.sort_by) {
        case 'name':
          filteredMCPs.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'created_at':
          filteredMCPs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'confidence_score':
          filteredMCPs.sort((a, b) => b.confidence_score - a.confidence_score);
          break;
        default: // popularity
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
      // Mock web search results based on official MCP repositories
      const mockWebResults: WebMCPResult[] = [
        {
          name: 'mcp-server-weather',
          description: 'Official weather MCP server from ModelContextProtocol organization',
          source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/weather',
          tags: ['weather', 'official', 'mcp'],
          domain: 'weather',
          validated: true,
          file_type: 'typescript',
          repository: 'modelcontextprotocol/servers',
          stars: 1250,
          source_platform: 'github',
          confidence_score: 0.95
        },
        {
          name: 'mcp-server-filesystem',
          description: 'Official filesystem MCP server for file operations',
          source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
          tags: ['filesystem', 'official', 'mcp'],
          domain: 'development',
          validated: true,
          file_type: 'typescript',
          repository: 'modelcontextprotocol/servers',
          stars: 1250,
          source_platform: 'github',
          confidence_score: 0.92
        },
        {
          name: 'mcp-server-fetch',
          description: 'Official HTTP fetch MCP server for web requests',
          source_url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
          tags: ['http', 'fetch', 'official', 'mcp'],
          domain: 'web',
          validated: true,
          file_type: 'typescript',
          repository: 'modelcontextprotocol/servers',
          stars: 1250,
          source_platform: 'github',
          confidence_score: 0.90
        }
      ];

      // Filter based on query
      const filteredResults = mockWebResults.filter(result => 
        result.name.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      return filteredResults.slice(0, limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Web search failed';
      setError(errorMessage);
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

  const scrapeSpecificUrl = async (
    url: string, 
    validate: boolean = true
  ): Promise<{
    success: boolean;
    url: string;
    name: string;
    description: string;
    domain: string;
    tags: string[];
    confidence_score: number;
    validated: boolean;
    schema?: any;
    content_length: number;
    scrape_duration_ms: number;
  }> => {
    // Mock implementation
    return {
      success: true,
      url,
      name: 'Scraped MCP',
      description: 'MCP scraped from provided URL',
      domain: 'general',
      tags: ['scraped', 'mcp'],
      confidence_score: 0.8,
      validated: validate,
      content_length: 1024,
      scrape_duration_ms: 500
    };
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
    // Mock implementation
    return {
      id: `imported_${Date.now()}`,
      message: 'MCP imported successfully',
      name: 'Imported MCP',
      source_url: sourceUrl,
      validated: autoValidate,
      domain: 'general',
      tags: ['imported']
    };
  };

  const getMCP = async (id: string): Promise<any> => {
    const mcp = DEMO_MCPS.find(m => m.id === id);
    if (!mcp) {
      throw new Error('MCP not found');
    }
    return mcp;
  };

  const importMCP = async (mcpData: {
    name: string;
    description?: string;
    schema_content: string | object;
    tags?: string[];
    domain?: string;
    source_url?: string;
  }): Promise<{ id: string; message: string; validated: boolean }> => {
    return {
      id: `mcp_${Date.now()}`,
      message: 'MCP imported successfully',
      validated: true
    };
  };

  const createShareLink = async (params: {
    session_id?: string;
    comparison_id?: string;
  }): Promise<{ share_id: string; share_url: string; expires_at: string }> => {
    return {
      share_id: `share_${Date.now()}`,
      share_url: `${window.location.origin}/shared/${Date.now()}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  };

  const exportCSV = async (comparison_id: string): Promise<Blob> => {
    const csvContent = 'Protocol,Latency,Tokens,Quality\nMock,500,200,8.5';
    return new Blob([csvContent], { type: 'text/csv' });
  };

  const getSearchAnalytics = async (): Promise<any> => {
    return {
      total_searches: 150,
      avg_results: 12.5,
      top_queries: ['weather', 'filesystem', 'github']
    };
  };

  const getScrapingAnalytics = async (): Promise<any> => {
    return {
      total_scrapes: 75,
      success_rate: 0.85,
      avg_response_time: 1200
    };
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
      features: [
        'demo_data',
        'mock_tools',
        'mcp_validation',
        'web_search_simulation'
      ],
      version: '3.0.0',
      scraping_enabled: true,
      supported_platforms: [
        'GitHub',
        'Official MCP Servers',
        'Demo Environment'
      ]
    };
  };

  return {
    loading,
    error,
    runAgent,
    compareProtocols,
    getMCPs,
    searchWebMCPs,
    enhancedSearchMCPs,
    scrapeSpecificUrl,
    importMCPFromWeb,
    getMCP,
    importMCP,
    createShareLink,
    exportCSV,
    getSearchAnalytics,
    getScrapingAnalytics,
    healthCheck,
    BACKEND_URL: 'mock://demo',
  };
};