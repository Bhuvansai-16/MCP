import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface MCPSchema {
  name: string;
  version: string;
  description?: string;
  tools: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
}

interface AgentRequest {
  prompt: string;
  document?: string;
  mcp_schema: MCPSchema;
}

interface ToolCall {
  tool: string;
  input: Record<string, any>;
  output: Record<string, any>;
  latency_ms: number;
  tokens_used: number;
}

interface AgentResponse {
  output: string;
  tool_calls: ToolCall[];
  tokens_used: number;
  latency_ms: number;
  model_used: string;
  session_id: string;
}

// Mock tool implementations
async function mockWeatherTool(location: string, units: string = "metric"): Promise<Record<string, any>> {
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API latency
  
  const mockData: Record<string, any> = {
    "paris": { temp: 22, condition: "Sunny", humidity: 65 },
    "london": { temp: 18, condition: "Cloudy", humidity: 78 },
    "new york": { temp: 25, condition: "Partly Cloudy", humidity: 60 },
    "tokyo": { temp: 28, condition: "Rainy", humidity: 85 }
  };
  
  const locationLower = location.toLowerCase();
  const data = mockData[locationLower] || { temp: 20, condition: "Unknown", humidity: 50 };
  
  return {
    location,
    temperature: data.temp,
    condition: data.condition,
    humidity: data.humidity,
    units
  };
}

async function mockSearchTool(query: string, limit: number = 5): Promise<Record<string, any>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const mockResults = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
    title: `Search result for '${query}' - Article ${i + 1}`,
    url: `https://example.com/article-${i + 1}`,
    snippet: `This is a mock search result snippet for ${query}...`
  }));
  
  return {
    query,
    results: mockResults,
    total: mockResults.length
  };
}

async function mockCalculatorTool(expression: string): Promise<Record<string, any>> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    // Simple expression evaluation (be careful in production!)
    const result = eval(expression.replace(/\^/g, '**'));
    return {
      expression,
      result,
      success: true
    };
  } catch (e) {
    return {
      expression,
      error: e instanceof Error ? e.message : 'Unknown error',
      success: false
    };
  }
}

async function executeTool(toolName: string, parameters: Record<string, any>): Promise<Record<string, any>> {
  if (toolName.toLowerCase().includes("weather")) {
    const location = parameters.location || "Unknown";
    const units = parameters.units || "metric";
    return await mockWeatherTool(location, units);
  }
  
  if (toolName.toLowerCase().includes("search")) {
    const query = parameters.query || "";
    const limit = parameters.limit || 5;
    return await mockSearchTool(query, limit);
  }
  
  if (toolName.toLowerCase().includes("calc") || toolName.toLowerCase().includes("math")) {
    const expression = parameters.expression || "1+1";
    return await mockCalculatorTool(expression);
  }
  
  // Generic mock response
  return {
    tool: toolName,
    input: parameters,
    result: `Mock result from ${toolName}`,
    success: true
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AgentRequest = await request.json();
    const { prompt, mcp_schema, document } = body;

    if (!prompt || !mcp_schema) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and mcp_schema' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const sessionId = uuidv4();
    
    // Analyze prompt to determine which tools to use
    const promptLower = prompt.toLowerCase();
    const toolCalls: ToolCall[] = [];
    let totalTokens = 0;
    
    // Simulate tool selection based on prompt content
    for (const tool of mcp_schema.tools) {
      const toolName = tool.name.toLowerCase();
      
      // Simple keyword matching to determine tool usage
      let shouldUseTool = false;
      if (toolName.includes("weather") && (promptLower.includes("weather") || promptLower.includes("temperature"))) {
        shouldUseTool = true;
      } else if (toolName.includes("search") && (promptLower.includes("search") || promptLower.includes("find"))) {
        shouldUseTool = true;
      } else if (toolName.includes("calc") && (promptLower.includes("calculate") || /[+\-*/]/.test(promptLower))) {
        shouldUseTool = true;
      }
      
      if (shouldUseTool) {
        // Generate mock parameters based on tool definition
        const mockParams: Record<string, any> = {};
        if (tool.parameters) {
          for (const [paramName, paramType] of Object.entries(tool.parameters)) {
            if (paramName === "location") {
              mockParams[paramName] = "Paris"; // Extract from prompt in real implementation
            } else if (paramName === "query") {
              mockParams[paramName] = prompt.substring(0, 50);
            } else if (paramName === "expression") {
              mockParams[paramName] = "2+2";
            } else {
              mockParams[paramName] = `mock_${paramName}`;
            }
          }
        }
        
        // Execute tool
        const toolStart = Date.now();
        const toolOutput = await executeTool(tool.name, mockParams);
        const toolLatency = Date.now() - toolStart;
        const toolTokens = Math.floor(JSON.stringify(toolOutput).length / 4); // Rough token estimation
        
        toolCalls.push({
          tool: tool.name,
          input: mockParams,
          output: toolOutput,
          latency_ms: toolLatency,
          tokens_used: toolTokens
        });
        totalTokens += toolTokens;
      }
    }
    
    // Generate agent response
    let agentOutput: string;
    if (toolCalls.length > 0) {
      const responseParts = [`I've executed ${toolCalls.length} tool(s) to help answer your question:\n`];
      for (const toolCall of toolCalls) {
        responseParts.push(`• ${toolCall.tool}: ${JSON.stringify(toolCall.output).substring(0, 100)}...`);
      }
      responseParts.push(`\nBased on these results, here's my response to '${prompt}':`);
      responseParts.push("This is a simulated agent response that would incorporate the tool results above.");
      agentOutput = responseParts.join('\n');
    } else {
      agentOutput = `I understand your request: '${prompt}'. However, none of the available tools in the MCP schema are suitable for this task. Available tools: ${mcp_schema.tools.map(t => t.name).join(', ')}`;
    }
    
    const totalLatency = Date.now() - startTime;
    totalTokens += Math.floor(agentOutput.length / 4); // Add response tokens
    
    const response: AgentResponse = {
      output: agentOutput,
      tool_calls: toolCalls,
      tokens_used: totalTokens,
      latency_ms: totalLatency,
      model_used: "gpt-4",
      session_id: sessionId
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Agent execution error:', error);
    return NextResponse.json(
      { error: 'Agent execution failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}