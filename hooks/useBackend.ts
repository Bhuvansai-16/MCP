import { useState } from 'react';

const BACKEND_URL = '/api';

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
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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
    return makeRequest<AgentResponse>('/run-agent', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  };

  const compareProtocols = async (request: CompareRequest): Promise<CompareResponse> => {
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