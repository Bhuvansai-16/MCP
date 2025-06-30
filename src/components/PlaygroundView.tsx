import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCPEditor } from './MCPEditor';
import { AgentChat } from './AgentChat';
import { ExecutionVisualization } from './ExecutionVisualization';
import { VisualMCPBuilder } from './VisualMCPBuilder';
import { MCPTemplates } from './MCPTemplates';
import { MCPSchema } from '../App';
import { Code, Palette, BookTemplate as FileTemplate, MessageSquare, ArrowLeft, Zap, CheckCircle, AlertCircle } from 'lucide-react';

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
type ViewMode = 'editor' | 'chat';

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ isDark, initialMCP }) => {
  const [mcpSchema, setMcpSchema] = useState<MCPSchema | null>(null);
  const [isValidMCP, setIsValidMCP] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('code');
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  // Load initial MCP if provided
  useEffect(() => {
    if (initialMCP) {
      console.log('📋 Loading initial MCP:', initialMCP.name);
      setMcpSchema(initialMCP);
      setIsValidMCP(true);
      
      // Add system message about loaded MCP
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `🎯 MCP "${initialMCP.name}" loaded successfully! Available tools: ${initialMCP.tools.map(t => t.name).join(', ')}`,
        timestamp: new Date()
      };
      
      setMessages([systemMessage]);
      console.log('✅ System message added for loaded MCP');
    }
  }, [initialMCP]);

  const handleMCPValidation = (schema: MCPSchema | null, isValid: boolean) => {
    console.log('🔍 MCP validation result:', { isValid, schema: schema?.name });
    setMcpSchema(schema);
    setIsValidMCP(isValid);
    if (!isValid) {
      setIsAgentRunning(false);
      setMessages([]);
      setExecutionLogs([]);
    }
  };

  const handleTemplateSelect = (template: MCPSchema) => {
    console.log('📋 Template selected:', template.name);
    setMcpSchema(template);
    setIsValidMCP(true);
    setEditorMode('code'); // Switch to code editor to show the loaded template
    
    // Add system message about loaded template
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: `📋 Template "${template.name}" loaded! You can now chat with the agent to test it.`,
      timestamp: new Date()
    };
    
    setMessages([systemMessage]);
  };

  const handleVisualMCPUpdate = (schema: MCPSchema) => {
    console.log('🎨 Visual MCP updated:', schema.name);
    setMcpSchema(schema);
    setIsValidMCP(true);
  };

  const startAgent = () => {
    if (!isValidMCP || !mcpSchema) {
      console.warn('⚠️ Cannot start agent: invalid MCP or no schema');
      return;
    }
    
    console.log('🤖 Starting agent with MCP:', mcpSchema.name);
    setIsAgentRunning(true);
    
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: `🤖 Agent started with MCP "${mcpSchema.name}". Available tools: ${mcpSchema.tools.map(t => t.name).join(', ')}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  const stopAgent = () => {
    console.log('🛑 Stopping agent');
    setIsAgentRunning(false);
    
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: '🛑 Agent stopped',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleUserMessage = async (content: string) => {
    if (!isAgentRunning || !mcpSchema) {
      console.warn('⚠️ Cannot process message: agent not running or no schema');
      return;
    }

    console.log('💬 Processing user message:', content);

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

  const handleChatWithAgent = () => {
    if (!isValidMCP || !mcpSchema) {
      return;
    }
    setViewMode('chat');
    if (!isAgentRunning) {
      startAgent();
    }
  };

  const handleBackToEditor = () => {
    setViewMode('editor');
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

  return (
    <div className="h-full overflow-hidden">
      <div className="container mx-auto px-6 py-8 h-full flex flex-col">
        <AnimatePresence mode="wait">
          {viewMode === 'editor' ? (
            <motion.div
              key="editor-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              {/* Editor Header */}
              <div className="flex-shrink-0 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Code className="w-8 h-8 text-white" />
                      </motion.div>
                      <div>
                        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          MCP Editor
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Create and edit Model Context Protocol schemas
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chat with Agent Button */}
                  <motion.button
                    onClick={handleChatWithAgent}
                    disabled={!isValidMCP}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      isValidMCP
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                        : isDark
                          ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/50'
                          : 'bg-gray-200/50 text-gray-500 cursor-not-allowed border border-gray-300/50'
                    } backdrop-blur-sm`}
                    whileHover={isValidMCP ? { scale: 1.05 } : {}}
                    whileTap={isValidMCP ? { scale: 0.95 } : {}}
                  >
                    <MessageSquare className="w-6 h-6" />
                    <span>Chat with Agent</span>
                    {isValidMCP ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>

                {/* MCP Status */}
                {mcpSchema && (
                  <motion.div
                    className={`mt-4 p-4 rounded-xl ${
                      isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50/50 border border-green-200/50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          {mcpSchema.name} v{mcpSchema.version}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                          {mcpSchema.tools.length} tool{mcpSchema.tools.length !== 1 ? 's' : ''} available: {mcpSchema.tools.map(t => t.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Editor Mode Selector */}
              <div className="flex-shrink-0 mb-4 flex justify-center">
                <div className="p-2 rounded-2xl backdrop-blur-sm border border-gray-200/20 bg-gray-100/50 dark:bg-gray-800/50 dark:border-gray-700/50">
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
              </div>

              {/* Editor Content - Full width for better editing experience */}
              <div className="flex-1 min-h-0" style={{ height: 'calc(100vh - 380px)' }}>
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
          ) : (
            <motion.div
              key="chat-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              {/* Chat Header */}
              <div className="flex-shrink-0 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.button
                      onClick={handleBackToEditor}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                        isDark 
                          ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                          : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                      } backdrop-blur-sm`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Editor</span>
                    </motion.button>

                    <div className="flex items-center space-x-3">
                      <motion.div
                        className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <MessageSquare className="w-8 h-8 text-white" />
                      </motion.div>
                      <div>
                        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Agent Chat
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Chat with your MCP-powered agent
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Tools Display */}
                {mcpSchema && (
                  <motion.div
                    className={`mt-4 p-4 rounded-xl ${
                      isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50/50 border border-blue-200/50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      <h3 className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                        Available Tools from {mcpSchema.name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mcpSchema.tools.map((tool, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 text-sm rounded-full ${
                            isDark 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Content */}
              <div className="flex-1 min-h-0" style={{ height: 'calc(100vh - 380px)' }}>
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Execution Visualization Panel */}
        {showExecutionPanel && viewMode === 'chat' && (
          <div className="flex-shrink-0 mt-6">
            <ExecutionVisualization
              isDark={isDark}
              executionLogs={executionLogs}
              onClose={() => setShowExecutionPanel(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};