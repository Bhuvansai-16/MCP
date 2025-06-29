import { useState } from 'react';

// Enhanced backend URL detection with better error handling
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    console.log('Current hostname:', hostname);
    console.log('Current protocol:', protocol);
    console.log('Current port:', port);
    
    // WebContainer detection with improved pattern matching
    if (hostname.includes('webcontainer-api.io') || hostname.includes('stackblitz.io')) {
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const prefix = parts[0];
        const suffix = parts.slice(1).join('.');
        const backendUrl = `${protocol}//${prefix}--8000--${suffix}`;
        console.log('WebContainer Backend URL:', backendUrl);
        return backendUrl;
      }
    }
    
    // Check if we're in development mode
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8000`;
    }
    
    // For other environments, try to construct the backend URL
    if (port && port !== '80' && port !== '443') {
      // If we're on a custom port, assume backend is on port 8000
      return `${protocol}//${hostname}:8000`;
    }
    
    // Try same origin with port 8000
    return `${protocol}//${hostname}:8000`;
  }
  
  return 'http://localhost:8000';
};

const BACKEND_URL = getBackendUrl();

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

export const useBackend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}${endpoint}`;
      console.log('Making request to:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      console.error('Backend request failed:', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    return makeRequest<MCPListItem[]>(`/mcps${query ? `?${query}` : ''}`);
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
    const searchParams = new URLSearchParams();
    searchParams.append('query', query);
    searchParams.append('limit', limit.toString());
    
    if (options.sources) {
      searchParams.append('sources', options.sources);
    }
    if (options.min_confidence !== undefined) {
      searchParams.append('min_confidence', options.min_confidence.toString());
    }
    if (options.use_scraping !== undefined) {
      searchParams.append('use_scraping', options.use_scraping.toString());
    }

    return makeRequest<WebMCPResult[]>(`/mcps/search?${searchParams.toString()}`);
  };

  const enhancedSearchMCPs = async (request: {
    query: string;
    limit?: number;
    sources?: string[];
    min_confidence?: number;
    domains?: string[];
    use_web_scraping?: boolean;
  }): Promise<WebMCPResult[]> => {
    return makeRequest<WebMCPResult[]>('/mcps/search/enhanced', {
      method: 'POST',
      body: JSON.stringify({
        limit: 20,
        sources: ["github", "web", "awesome"],
        min_confidence: 0.0,
        use_web_scraping: true,
        ...request
      }),
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
    const searchParams = new URLSearchParams();
    searchParams.append('url', url);
    searchParams.append('validate', validate.toString());

    return makeRequest(`/mcps/search/scrape?${searchParams.toString()}`);
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
    const searchParams = new URLSearchParams();
    searchParams.append('source_url', sourceUrl);
    searchParams.append('auto_validate', autoValidate.toString());

    return makeRequest<{
      id: string;
      message: string;
      name: string;
      source_url: string;
      validated: boolean;
      domain: string;
      tags: string[];
    }>(`/mcps/import-from-web?${searchParams.toString()}`, {
      method: 'POST',
    });
  };

  const getMCP = async (id: string): Promise<any> => {
    return makeRequest<any>(`/mcp/${id}`);
  };

  const importMCP = async (mcpData: {
    name: string;
    description?: string;
    schema_content: string | object;
    tags?: string[];
    domain?: string;
    source_url?: string;
  }): Promise<{ id: string; message: string; validated: boolean }> => {
    return makeRequest<{ id: string; message: string; validated: boolean }>('/mcp/import', {
      method: 'POST',
      body: JSON.stringify(mcpData),
    });
  };

  const createShareLink = async (params: {
    session_id?: string;
    comparison_id?: string;
  }): Promise<{ share_id: string; share_url: string; expires_at: string }> => {
    return makeRequest<{ share_id: string; share_url: string; expires_at: string }>('/share', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  };

  const exportCSV = async (comparison_id: string): Promise<Blob> => {
    const url = `${BACKEND_URL}/export/csv?comparison_id=${comparison_id}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    return response.blob();
  };

  const getSearchAnalytics = async (): Promise<any> => {
    return makeRequest<any>('/analytics/search');
  };

  const getScrapingAnalytics = async (): Promise<any> => {
    return makeRequest<any>('/analytics/scraping');
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
    return makeRequest<{ 
      status: string; 
      timestamp: string; 
      database: string;
      features: string[];
      version: string;
      scraping_enabled: boolean;
      supported_platforms: string[];
    }>('/health');
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
    BACKEND_URL,
  };
};