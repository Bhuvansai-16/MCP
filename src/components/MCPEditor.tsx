import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
  Code, 
  Download, 
  Github, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  HelpCircle,
  Zap,
  Play,
  Copy,
  Check,
  Upload,
  RefreshCw
} from 'lucide-react';
import * as yaml from 'js-yaml';
import { MCPSchema } from '../App';

interface MCPEditorProps {
  isDark: boolean;
  onValidation: (schema: any, isValid: boolean) => void;
  mcpSchema: any;
  isValid: boolean;
  initialSchema?: MCPSchema | null;
}

const exampleMCP = {
  name: "weather.forecast",
  version: "1.0.0",
  description: "Real-time weather data and forecasting with global coverage",
  tools: [
    {
      name: "get_current_weather",
      description: "Get current weather for a specific location",
      parameters: {
        location: "string",
        units: "string"
      }
    },
    {
      name: "get_forecast",
      description: "Get weather forecast for next 7 days",
      parameters: {
        location: "string",
        days: "number",
        units: "string"
      }
    },
    {
      name: "search_locations",
      description: "Search for weather station locations",
      parameters: {
        query: "string",
        limit: "number"
      }
    }
  ]
};

const exampleMCPs = [
  {
    name: "Weather API",
    description: "Real-time weather data with forecasting",
    schema: exampleMCP
  },
  {
    name: "E-commerce",
    description: "Complete online store management",
    schema: {
      name: "ecommerce.store",
      version: "2.1.0",
      description: "Complete e-commerce functionality with product management",
      tools: [
        {
          name: "search_products",
          description: "Search for products in the store",
          parameters: {
            query: "string",
            category: "string",
            price_range: "object"
          }
        },
        {
          name: "add_to_cart",
          description: "Add product to shopping cart",
          parameters: {
            product_id: "string",
            quantity: "number"
          }
        },
        {
          name: "process_payment",
          description: "Process payment for cart items",
          parameters: {
            payment_method: "string",
            amount: "number"
          }
        }
      ]
    }
  },
  {
    name: "Calendar Management",
    description: "Smart scheduling and event management",
    schema: {
      name: "calendar.events",
      version: "1.3.0",
      description: "Calendar management with Google Calendar integration",
      tools: [
        {
          name: "create_event",
          description: "Create a new calendar event",
          parameters: {
            title: "string",
            start_time: "datetime",
            end_time: "datetime",
            attendees: "array"
          }
        },
        {
          name: "list_events",
          description: "List upcoming events",
          parameters: {
            start_date: "date",
            end_date: "date",
            calendar_id: "string"
          }
        },
        {
          name: "update_event",
          description: "Update an existing event",
          parameters: {
            event_id: "string",
            updates: "object"
          }
        }
      ]
    }
  },
  {
    name: "Travel Planner",
    description: "Comprehensive travel booking and planning",
    schema: {
      name: "travel.planner",
      version: "2.0.0",
      description: "Travel booking and itinerary management",
      tools: [
        {
          name: "search_flights",
          description: "Search for available flights",
          parameters: {
            origin: "string",
            destination: "string",
            departure_date: "date",
            passengers: "number"
          }
        },
        {
          name: "book_hotel",
          description: "Book hotel accommodation",
          parameters: {
            location: "string",
            check_in: "date",
            check_out: "date",
            guests: "number"
          }
        },
        {
          name: "create_itinerary",
          description: "Create detailed travel itinerary",
          parameters: {
            destination: "string",
            duration: "number",
            interests: "array"
          }
        }
      ]
    }
  }
];

export const MCPEditor: React.FC<MCPEditorProps> = ({ 
  isDark, 
  onValidation, 
  mcpSchema, 
  isValid,
  initialSchema
}) => {
  const [editorValue, setEditorValue] = useState(JSON.stringify(exampleMCP, null, 2));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isJsonMode, setIsJsonMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load initial schema if provided
  useEffect(() => {
    if (initialSchema) {
      const formatted = isJsonMode 
        ? JSON.stringify(initialSchema, null, 2)
        : yaml.dump(initialSchema);
      setEditorValue(formatted);
    }
  }, [initialSchema, isJsonMode]);

  useEffect(() => {
    validateMCP(editorValue);
  }, [editorValue]);

  const validateMCP = (value: string) => {
    try {
      let parsed;
      if (isJsonMode) {
        parsed = JSON.parse(value);
      } else {
        parsed = yaml.load(value);
      }

      // Enhanced MCP validation
      const errors = [];

      if (!parsed.name || typeof parsed.name !== 'string') {
        errors.push('Missing or invalid "name" field');
      }

      if (!parsed.version || typeof parsed.version !== 'string') {
        errors.push('Missing or invalid "version" field');
      }

      if (!parsed.tools || !Array.isArray(parsed.tools)) {
        errors.push('Missing or invalid "tools" field (must be an array)');
      } else {
        parsed.tools.forEach((tool: any, index: number) => {
          if (!tool.name || typeof tool.name !== 'string') {
            errors.push(`Tool ${index + 1}: missing or invalid "name" field`);
          }
          if (!tool.description || typeof tool.description !== 'string') {
            errors.push(`Tool ${index + 1}: missing or invalid "description" field`);
          }
          if (!tool.parameters || typeof tool.parameters !== 'object') {
            errors.push(`Tool ${index + 1}: missing or invalid "parameters" field`);
          }
        });
      }

      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }

      setValidationError(null);
      onValidation(parsed, true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid MCP schema';
      setValidationError(errorMessage);
      onValidation(null, false);
    }
  };

  const loadExample = (example: any) => {
    const formatted = isJsonMode 
      ? JSON.stringify(example.schema, null, 2)
      : yaml.dump(example.schema);
    setEditorValue(formatted);
  };

  const toggleFormat = () => {
    try {
      if (isJsonMode) {
        // Convert JSON to YAML
        const parsed = JSON.parse(editorValue);
        setEditorValue(yaml.dump(parsed));
      } else {
        // Convert YAML to JSON
        const parsed = yaml.load(editorValue);
        setEditorValue(JSON.stringify(parsed, null, 2));
      }
      setIsJsonMode(!isJsonMode);
    } catch (error) {
      // If conversion fails, just toggle mode without converting
      setIsJsonMode(!isJsonMode);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editorValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const generateExampleValues = () => {
    const exampleSchema = {
      name: "example-mcp",
      version: "1.0.0",
      description: "An example MCP for demonstration purposes",
      tools: [
        {
          name: "get_data",
          description: "Retrieve data from a source",
          parameters: {
            source: "string",
            limit: "number",
            format: "string"
          }
        },
        {
          name: "process_data",
          description: "Process the retrieved data",
          parameters: {
            data: "object",
            operation: "string"
          }
        }
      ]
    };

    const formatted = isJsonMode 
      ? JSON.stringify(exampleSchema, null, 2)
      : yaml.dump(exampleSchema);
    setEditorValue(formatted);
  };

  const testMCP = () => {
    if (isValid && mcpSchema) {
      // This would trigger a test run of the MCP
      console.log('Testing MCP:', mcpSchema);
    }
  };

  return (
    <div className={`h-full rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
      isDark 
        ? 'bg-gray-800/30 border-gray-700/50' 
        : 'bg-white/30 border-white/50'
    } shadow-2xl flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Code className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                MCP Editor
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Write or import Model Context Protocol schemas
              </p>
            </div>
          </div>

          {/* Validation Status */}
          <div className="flex items-center space-x-2">
            {isValid ? (
              <motion.div
                className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Valid MCP</span>
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Invalid</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            onClick={toggleFormat}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              isDark 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText className="w-4 h-4" />
            <span>{isJsonMode ? 'JSON' : 'YAML'}</span>
          </motion.button>

          <motion.button
            onClick={copyToClipboard}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : isDark 
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </motion.button>

          <motion.button
            onClick={generateExampleValues}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              isDark 
                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Example</span>
          </motion.button>

          <motion.button
            onClick={testMCP}
            disabled={!isValid}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              isValid
                ? isDark
                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
                : isDark
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed border border-gray-600/30'
                  : 'bg-gray-100/30 text-gray-400 cursor-not-allowed border border-gray-200/30'
            } backdrop-blur-sm`}
            whileHover={isValid ? { scale: 1.05 } : {}}
            whileTap={isValid ? { scale: 0.95 } : {}}
          >
            <Play className="w-4 h-4" />
            <span>Test MCP</span>
          </motion.button>

          <motion.button
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              showHelp
                ? isDark
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-purple-50 text-purple-600 border border-purple-200'
                : isDark 
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </motion.button>
        </div>

        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              className={`mt-4 p-4 rounded-xl ${
                isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50/50 border border-purple-200/50'
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                MCP Schema Structure
              </h4>
              <div className={`text-sm space-y-2 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                <p><strong>name:</strong> Unique identifier for your MCP (required)</p>
                <p><strong>version:</strong> Semantic version number (required)</p>
                <p><strong>description:</strong> Brief description of functionality (optional)</p>
                <p><strong>tools:</strong> Array of available tools (required)</p>
                <div className="ml-4">
                  <p><strong>tool.name:</strong> Tool identifier (required)</p>
                  <p><strong>tool.description:</strong> What the tool does (required)</p>
                  <p><strong>tool.parameters:</strong> Input parameters object (required)</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example MCPs */}
        <div className="mt-4">
          <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <Sparkles className="w-4 h-4 inline mr-1" />
            Load Example MCP:
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleMCPs.map((example, index) => (
              <motion.button
                key={index}
                onClick={() => loadExample(example)}
                className={`group relative px-3 py-2 rounded-lg text-xs transition-all duration-300 ${
                  isDark 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-3 h-3" />
                  <span>{example.name}</span>
                </div>
                
                {/* Tooltip */}
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap ${
                  isDark ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
                } shadow-lg backdrop-blur-sm`}>
                
                  {example.description}
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 ${
                    isDark ? 'bg-gray-800 border-r border-b border-gray-600' : 'bg-white border-r border-b border-gray-200'
                  }`} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full rounded-xl overflow-hidden border border-gray-200/20">
          <Editor
            height="100%"
            language={isJsonMode ? 'json' : 'yaml'}
            value={editorValue}
            onChange={(value) => setEditorValue(value || '')}
            theme={isDark ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              glyphMargin: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
              }
            }}
          />
        </div>

        {/* Validation Error */}
        {validationError && (
          <motion.div
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium text-sm">Validation Error</p>
                <p className="text-red-300 text-sm mt-1">{validationError}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* MCP Info */}
        {isValid && mcpSchema && (
          <motion.div
            className={`mt-4 p-4 rounded-xl ${
              isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50/50 border border-green-200/50'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-400 font-medium text-sm">
                  {mcpSchema.name} v{mcpSchema.version}
                </p>
                <p className="text-green-300 text-sm mt-1">
                  {mcpSchema.tools.length} tool{mcpSchema.tools.length !== 1 ? 's' : ''} available: {mcpSchema.tools.map((t: any) => t.name).join(', ')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};