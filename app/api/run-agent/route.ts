import { NextRequest, NextResponse } from 'next/server';

interface AgentRequest {
  prompt: string;
  document?: string;
  mcp_schema: {
    name: string;
    version: string;
    description?: string;
    tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>;
  };
}

interface ToolCall {
  tool: string;
  input: Record<string, any>;
  output: Record<string, any>;
  latency_ms: number;
  tokens_used: number;
}

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

export async function POST(request: NextRequest) {
  try {
    const body: AgentRequest = await request.json();
    const { prompt, document, mcp_schema } = body;

    if (!prompt || !mcp_schema) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and mcp_schema' },
        { status: 400 }
      );
    }

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

    const response = {
      output: agentOutput,
      tool_calls: toolCalls,
      tokens_used: totalTokens,
      latency_ms: totalLatency,
      model_used: 'mcp-simulator',
      session_id: sessionId
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Agent execution error:', error);
    return NextResponse.json(
      { error: 'Agent execution failed' },
      { status: 500 }
    );
  }
}