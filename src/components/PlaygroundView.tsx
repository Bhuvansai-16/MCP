import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCPEditor } from './MCPEditor';
import { AgentChat } from './AgentChat';
import { ExecutionVisualization } from './ExecutionVisualization';
import { VisualMCPBuilder } from './VisualMCPBuilder';
import { MCPTemplates } from './MCPTemplates';
import { MCPSchema } from '../App';
import { Code, Palette, BookTemplate as FileTemplate, Sparkles, Zap } from 'lucide-react';

interface PlaygroundViewProps {
  isDark: boolean;
  initialMCP?: MCPSchema | null;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
}

interface ExecutionLog {
  id: string;
  timestamp: Date;
  tool: string;
  input: any;
  output: any;
  tokens: number;
  latency: number;
}

type EditorMode = 'code' | 'visual' | 'templates';

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ isDark, initialMCP }) => {
  const [mcpSchema, setMcpSchema] = useState<MCPSchema | null>(null);
  const [isValidMCP, setIsValidMCP] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('code');

  // Load initial MCP if provided
  useEffect(() => {
    if (initialMCP) {
      setMcpSchema(initialMCP);
      setIsValidMCP(true);
      
      // Add system message about loaded MCP
      setMessages([{
        id: Date.now().toString(),
        type: 'system',
        content: `🎯 MCP "${initialMCP.name}" loaded successfully! Available tools: ${initialMCP.tools.map(t => t.name).join(', ')}`,
        timestamp: new Date()
      }]);
    }
  }, [initialMCP]);

  const handleMCPValidation = (schema: MCPSchema | null, isValid: boolean) => {
    setMcpSchema(schema);
    setIsValidMCP(isValid);
    if (!isValid) {
      setIsAgentRunning(false);
      setMessages([]);
      setExecutionLogs([]);
    }
  };

  const handleTemplateSelect = (template: MCPSchema) => {
    setMcpSchema(template);
    setIsValidMCP(true);
    setEditorMode('code'); // Switch to code editor to show the loaded template
    
    // Add system message about loaded template
    setMessages([{
      id: Date.now().toString(),
      type: 'system',
      content: `📋 Template "${template.name}" loaded! You can now start the agent to test it.`,
      timestamp: new Date()
    }]);
  };

  const handleVisualMCPUpdate = (schema: MCPSchema) => {
    setMcpSchema(schema);
    setIsValidMCP(true);
  };

  const startAgent = () => {
    if (!isValidMCP || !mcpSchema) return;
    
    setIsAgentRunning(true);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      content: `🤖 Agent started with MCP "${mcpSchema.name}". Available tools: ${mcpSchema.tools.map(t => t.name).join(', ')}`,
      timestamp: new Date()
    }]);
  };

  const stopAgent = () => {
    setIsAgentRunning(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      content: '🛑 Agent stopped',
      timestamp: new Date()
    }]);
  };

  const handleUserMessage = async (content: string) => {
    if (!isAgentRunning || !mcpSchema) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Simulate agent processing
    setTimeout(async () => {
      // Simulate tool usage based on message content
      const toolCalls = simulateToolUsage(content, mcpSchema);
      
      // Add execution logs
      const newLogs: ExecutionLog[] = toolCalls.map(call => ({
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(),
        tool: call.tool,
        input: call.input,
        output: call.output,
        tokens: Math.floor(Math.random() * 100) + 50,
        latency: Math.floor(Math.random() * 500) + 100
      }));
      setExecutionLogs(prev => [...prev, ...newLogs]);

      // Generate agent response
      const agentResponse = generateAgentResponse(content, toolCalls, mcpSchema);
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: agentResponse,
        timestamp: new Date(),
        toolCalls
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000 + Math.random() * 2000);
  };

  const simulateToolUsage = (userMessage: string, schema: MCPSchema) => {
    const toolCalls = [];
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword matching to determine which tools to use
    for (const tool of schema.tools) {
      const toolName = tool.name.toLowerCase();
      if (lowerMessage.includes(toolName) || 
          lowerMessage.includes(tool.description.toLowerCase().split(' ')[0]) ||
          (toolName.includes('weather') && lowerMessage.includes('weather')) ||
          (toolName.includes('search') && lowerMessage.includes('search')) ||
          (toolName.includes('fetch') && lowerMessage.includes('get'))) {
        
        // Generate mock input/output based on tool
        const mockInput = generateMockInput(tool);
        const mockOutput = generateMockOutput(tool, mockInput);
        
        toolCalls.push({
          tool: tool.name,
          input: mockInput,
          output: mockOutput
        });
      }
    }

    return toolCalls;
  };

  const generateMockInput = (tool: any) => {
    const mockInputs: Record<string, any> = {
      'weather': { location: 'San Francisco', units: 'metric' },
      'search': { query: 'latest news', limit: 5 },
      'fetch': { url: 'https://api.example.com/data' },
      'calendar': { title: 'Meeting', date: '2024-01-15' },
      'email': { to: 'user@example.com', subject: 'Hello' }
    };

    const toolName = tool.name.toLowerCase();
    for (const [key, value] of Object.entries(mockInputs)) {
      if (toolName.includes(key)) {
        return value;
      }
    }

    // Generate based on parameters
    const input: Record<string, any> = {};
    Object.entries(tool.parameters).forEach(([key, type]) => {
      if (typeof type === 'string') {
        switch (type) {
          case 'string':
            input[key] = `sample_${key}`;
            break;
          case 'number':
            input[key] = Math.floor(Math.random() * 100);
            break;
          case 'boolean':
            input[key] = Math.random() > 0.5;
            break;
          default:
            input[key] = `sample_${key}`;
        }
      }
    });

    return input;
  };

  const generateMockOutput = (tool: any, input: any) => {
    const toolName = tool.name.toLowerCase();
    
    if (toolName.includes('weather')) {
      return {
        temperature: 22,
        condition: 'Sunny',
        humidity: 65,
        location: input.location || 'Unknown'
      };
    }
    
    if (toolName.includes('search')) {
      return {
        results: [
          { title: 'Search Result 1', url: 'https://example.com/1' },
          { title: 'Search Result 2', url: 'https://example.com/2' }
        ],
        total: 2
      };
    }
    
    if (toolName.includes('fetch')) {
      return {
        status: 200,
        data: { message: 'Data fetched successfully', timestamp: new Date().toISOString() }
      };
    }

    return {
      success: true,
      message: `${tool.name} executed successfully`,
      data: input
    };
  };

  const generateAgentResponse = (userMessage: string, toolCalls: any[], schema: MCPSchema) => {
    if (toolCalls.length === 0) {
      return `I understand you're asking about "${userMessage}". However, I don't have the right tools available in the current MCP to help with that specific request. The available tools are: ${schema.tools.map(t => t.name).join(', ')}.`;
    }

    let response = `I've processed your request using the following tools:\n\n`;
    
    toolCalls.forEach(call => {
      response += `🔧 **${call.tool}**: `;
      if (call.tool.toLowerCase().includes('weather')) {
        response += `The weather in ${call.input.location} is ${call.output.temperature}°C and ${call.output.condition}.\n`;
      } else if (call.tool.toLowerCase().includes('search')) {
        response += `Found ${call.output.total} results for "${call.input.query}".\n`;
      } else if (call.tool.toLowerCase().includes('fetch')) {
        response += `Successfully fetched data with status ${call.output.status}.\n`;
      } else {
        response += `Executed successfully with result: ${JSON.stringify(call.output).substring(0, 100)}...\n`;
      }
    });

    response += `\nIs there anything else you'd like me to help you with using the available MCP tools?`;
    return response;
  };

  const renderEditor = () => {
    switch (editorMode) {
      case 'templates':
        return (
          <MCPTemplates
            isDark={isDark}
            onTemplateSelect={handleTemplateSelect}
          />
        );
      case 'visual':
        return (
          <VisualMCPBuilder
            isDark={isDark}
            initialSchema={mcpSchema}
            onSchemaUpdate={handleVisualMCPUpdate}
          />
        );
      default:
        return (
          <MCPEditor
            isDark={isDark}
            onValidation={handleMCPValidation}
            mcpSchema={mcpSchema}
            isValid={isValidMCP}
            initialSchema={initialMCP}
          />
        );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden">
      <div className="container mx-auto px-6 py-8 h-full overflow-y-auto">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* MCP Editor Panel (Left) */}
          <motion.div 
            className="flex flex-col h-full min-h-0 overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Editor Mode Selector */}
            <div className={`mb-4 p-2 rounded-2xl ${
              isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
            } backdrop-blur-sm border ${
              isDark ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <div className="flex space-x-2">
                <motion.button
                  onClick={() => setEditorMode('templates')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    editorMode === 'templates'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileTemplate className="w-4 h-4" />
                  <span>Templates</span>
                </motion.button>

                <motion.button
                  onClick={() => setEditorMode('visual')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    editorMode === 'visual'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Palette className="w-4 h-4" />
                  <span>Visual</span>
                </motion.button>

                <motion.button
                  onClick={() => setEditorMode('code')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    editorMode === 'code'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Code className="w-4 h-4" />
                  <span>Code</span>
                </motion.button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={editorMode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {renderEditor()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Chat Panel (Right) */}
          <motion.div 
            className="flex flex-col h-full min-h-0 overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AgentChat
              isDark={isDark}
              messages={messages}
              isAgentRunning={isAgentRunning}
              isValidMCP={isValidMCP}
              mcpSchema={mcpSchema}
              onStartAgent={startAgent}
              onStopAgent={stopAgent}
              onUserMessage={handleUserMessage}
              onToggleExecution={() => setShowExecutionPanel(!showExecutionPanel)}
              showExecutionPanel={showExecutionPanel}
            />
          </motion.div>
        </motion.div>

        {/* Execution Visualization Panel */}
        {showExecutionPanel && (
          <motion.div
            className="mt-6 h-96 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ExecutionVisualization
              isDark={isDark}
              executionLogs={executionLogs}
              onClose={() => setShowExecutionPanel(false)}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};