import { useState } from 'react';

// Dynamic API base URL detection for backend
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    console.log('Current hostname:', hostname);
    console.log('Current protocol:', protocol);
    console.log('Current port:', port);
    
    if (hostname.includes('webcontainer-api.io')) {
      // Extract the WebContainer URL pattern and construct backend URL
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
  }
  
  const fallbackUrl = 'http://localhost:8000';
  console.log('Using fallback Backend URL:', fallbackUrl);
  return fallbackUrl;
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
    return makeRequest<AgentResponse>('/run-agent', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  };

  const compareProtocols = async (request: CompareRequest): Promise<CompareResponse> => {
    return makeRequest<CompareResponse>('/compare-protocols', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  };

  const getMCPs = async (params: {
    domain?: string;
    tags?: string;
    validated?: boolean;
    sort_by?: string;
    limit?: number;
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

  const searchWebMCPs = async (query: string, limit: number = 10): Promise<WebMCPResult[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('query', query);
    searchParams.append('limit', limit.toString());

    return makeRequest<WebMCPResult[]>(`/mcps/search?${searchParams.toString()}`);
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

  const healthCheck = async (): Promise<{ 
    status: string; 
    timestamp: string; 
    database: string;
    features: string[];
  }> => {
    return makeRequest<{ 
      status: string; 
      timestamp: string; 
      database: string;
      features: string[];
    }>('/health');
  };

  return {
    loading,
    error,
    runAgent,
    compareProtocols,
    getMCPs,
    searchWebMCPs,
    importMCPFromWeb,
    getMCP,
    importMCP,
    createShareLink,
    exportCSV,
    healthCheck,
    BACKEND_URL,
  };
};