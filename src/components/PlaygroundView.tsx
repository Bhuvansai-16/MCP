import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCPEditor } from './MCPEditor';
import { AgentChat } from './AgentChat';
import { ExecutionVisualization } from './ExecutionVisualization';
import { VisualMCPBuilder } from './VisualMCPBuilder';
import { MCPTemplates } from './MCPTemplates';
import { MCPSchema } from '../App';
import { Code, Palette, BookTemplate as FileTemplate, Eye, EyeOff, GripVertical } from 'lucide-react';

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
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load initial MCP if provided
  useEffect(() => {
    if (initialMCP) {
      console.log('📋 Loading initial MCP:', initialMCP.name);
      setMcpSchema(initialMCP);
      setIsValidMCP(true);
      
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

  // Handle resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const constrainedWidth = Math.max(25, Math.min(75, newLeftWidth));
    setLeftPanelWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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
    setEditorMode('code');
    
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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    setTimeout(async () => {
      const toolCalls = simulateToolUsage(content, mcpSchema);
      
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

    for (const tool of schema.tools) {
      const toolName = tool.name.toLowerCase();
      if (lowerMessage.includes(toolName) || 
          lowerMessage.includes(tool.description.toLowerCase().split(' ')[0]) ||
          (toolName.includes('weather') && lowerMessage.includes('weather')) ||
          (toolName.includes('search') && lowerMessage.includes('search')) ||
          (toolName.includes('fetch') && lowerMessage.includes('get'))) {
        
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200/20 dark:border-gray-700/50">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Code className="w-5 h-5 text-white" />
            </motion.div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              MCP Playground
            </h1>
          </div>
          
          {/* Execution Panel Toggle */}
          <motion.button
            onClick={() => setShowExecutionPanel(!showExecutionPanel)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
              showExecutionPanel
                ? isDark 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                : isDark 
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showExecutionPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">Execution</span>
          </motion.button>
        </div>
        
        {/* Editor Mode Selector */}
        <div className="flex justify-center">
          <div className="p-1 rounded-xl backdrop-blur-sm border border-gray-200/20 bg-gray-100/50 dark:bg-gray-800/50 dark:border-gray-700/50">
            <div className="flex space-x-1">
              <motion.button
                onClick={() => setEditorMode('templates')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
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
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
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
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Resizable Panels Container */}
        <div 
          ref={containerRef}
          className="flex-1 flex playground-layout overflow-hidden"
        >
          {/* Left Panel - MCP Editor */}
          <div 
            className="playground-panel h-full overflow-hidden"
            style={{ 
              width: window.innerWidth >= 1024 ? `${leftPanelWidth}%` : '100%',
              minHeight: '500px'
            }}
          >
            <div className="h-full rounded-lg border border-gray-200/20 dark:border-gray-700/50 overflow-hidden">
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
          </div>
          
          {/* Resizable Divider - Hidden on mobile */}
          {window.innerWidth >= 1024 && (
            <div 
              className={`w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors duration-200 flex items-center justify-center group relative ${
                isResizing ? 'bg-blue-500 dark:bg-blue-400' : ''
              }`}
              onMouseDown={handleMouseDown}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute">
                <GripVertical className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
          
          {/* Right Panel - Agent Chat */}
          <div 
            className="playground-panel h-full overflow-hidden"
            style={{ 
              width: window.innerWidth >= 1024 ? `${100 - leftPanelWidth}%` : '100%',
              minHeight: '500px'
            }}
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
          </div>
        </div>

        {/* Execution Visualization Panel - Full Width Below */}
        <AnimatePresence>
          {showExecutionPanel && (
            <motion.div
              className="flex-shrink-0 border-t border-gray-200/20 dark:border-gray-700/50"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ maxHeight: '300px' }}
            >
              <div className="h-full overflow-y-auto p-4">
                <ExecutionVisualization
                  isDark={isDark}
                  executionLogs={executionLogs}
                  onClose={() => setShowExecutionPanel(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};