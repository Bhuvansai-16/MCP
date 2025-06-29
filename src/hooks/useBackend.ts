import { useState, useEffect } from 'react';
import { webScraperService, ScrapedMCP } from '../services/webScraper';
import { mockLocalMCPs, MCPListItem, WebMCPResult } from '../data/mockMCPs';

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

// Re-export types from data file
export type { MCPListItem, WebMCPResult };

export const useBackend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMCPs, setLocalMCPs] = useState<MCPListItem[]>([]);

  // Load local MCPs on initialization
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // In a real app, this would fetch from an API
        setLocalMCPs(mockLocalMCPs);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    
    loadInitialData();
  }, []);

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
      console.log('📚 Loading local MCPs with params:', params);
      
      // Filter mock data based on parameters
      let filteredMCPs = [...localMCPs];

      if (params.domain && params.domain !== 'all') {
        filteredMCPs = filteredMCPs.filter(mcp => mcp.domain === params.domain);
        console.log(`🔍 Filtered by domain '${params.domain}': ${filteredMCPs.length} results`);
      }

      if (params.tags) {
        filteredMCPs = filteredMCPs.filter(mcp => 
          mcp.tags.some(tag => tag.toLowerCase().includes(params.tags!.toLowerCase()))
        );
        console.log(`🏷️ Filtered by tags '${params.tags}': ${filteredMCPs.length} results`);
      }

      if (params.validated !== undefined) {
        filteredMCPs = filteredMCPs.filter(mcp => mcp.validated === params.validated);
        console.log(`✅ Filtered by validated '${params.validated}': ${filteredMCPs.length} results`);
      }

      if (params.min_confidence !== undefined) {
        filteredMCPs = filteredMCPs.filter(mcp => mcp.confidence_score >= params.min_confidence!);
        console.log(`📊 Filtered by confidence >= ${params.min_confidence}: ${filteredMCPs.length} results`);
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

      console.log(`✅ Final results: ${filteredMCPs.length} MCPs`);
      return filteredMCPs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch MCPs';
      console.error('❌ Error loading local MCPs:', errorMessage);
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
      console.log('🌐 Starting web search with parameters:', {
        query,
        limit,
        options
      });
      
      if (!options.use_scraping) {
        console.log('⚠️ Web scraping disabled, returning empty results');
        return [];
      }

      // Initialize web scraper service
      console.log('🔧 Initializing web scraper service...');
      await webScraperService.initialize();

      // Perform the search
      console.log('🔍 Performing comprehensive web search...');
      const startTime = Date.now();
      const results = await webScraperService.searchAll(query, limit);
      const searchDuration = Date.now() - startTime;
      
      console.log(`⏱️ Search completed in ${searchDuration}ms`);
      console.log(`📊 Raw results: ${results.length} MCPs found`);
      
      // Filter by confidence if specified
      const filteredResults = options.min_confidence 
        ? results.filter(r => {
            const meetsConfidence = r.confidence_score >= options.min_confidence!;
            if (!meetsConfidence) {
              console.log(`🔽 Filtered out ${r.name} (confidence: ${r.confidence_score})`);
            }
            return meetsConfidence;
          })
        : results;

      console.log(`✅ Final filtered results: ${filteredResults.length} MCPs`);
      
      // Log detailed results for debugging
      filteredResults.forEach((result, index) => {
        console.log(`📋 Result ${index + 1}:`, {
          name: result.name,
          source: result.source_platform,
          confidence: result.confidence_score,
          url: result.source_url
        });
      });

      return filteredResults;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Web search failed';
      console.error('❌ Web search error:', err);
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
    console.log('🚀 Enhanced search request:', request);
    
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
      console.log('📥 Importing MCP from:', sourceUrl);
      
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

      // Add to local MCPs
      setLocalMCPs(prev => [newMCP, ...prev]);

      console.log('✅ Successfully imported MCP:', newMCP.name);

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
      console.error('❌ Import failed:', err);
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
    console.log('🏥 Health check requested');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      features: ['web_scraping', 'mcp_validation', 'client_side_scraping'],
      version: '3.0.0',
      scraping_enabled: true,
      supported_platforms: ['GitHub', 'General Web', 'Awesome Lists']
    };
    
    console.log('✅ Health check result:', health);
    return health;
  };

  // Cleanup function to close browser when component unmounts
  const cleanup = async () => {
    console.log('🧹 Cleaning up web scraper service...');
    await webScraperService.cleanup();
  };

  return {
    loading,
    error,
    localMCPs,
    runAgent,
    compareProtocols,
    getMCPs,
    searchWebMCPs,
    enhancedSearchMCPs,
    importMCPFromWeb,
    healthCheck,
    cleanup,
    BACKEND_URL: 'client-side-implementation',
  };
};