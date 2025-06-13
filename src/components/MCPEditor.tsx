import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Code, Download, Github, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import * as yaml from 'js-yaml';

interface MCPEditorProps {
  isDark: boolean;
  onValidation: (schema: any, isValid: boolean) => void;
  mcpSchema: any;
  isValid: boolean;
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
    schema: exampleMCP
  },
  {
    name: "E-commerce",
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
  }
];

export const MCPEditor: React.FC<MCPEditorProps> = ({ 
  isDark, 
  onValidation, 
  mcpSchema, 
  isValid 
}) => {
  const [editorValue, setEditorValue] = useState(JSON.stringify(exampleMCP, null, 2));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isJsonMode, setIsJsonMode] = useState(true);

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

      // Basic MCP validation
      if (!parsed.name || !parsed.version || !parsed.tools || !Array.isArray(parsed.tools)) {
        throw new Error('Invalid MCP schema: missing required fields (name, version, tools)');
      }

      for (const tool of parsed.tools) {
        if (!tool.name || !tool.description || !tool.parameters) {
          throw new Error(`Invalid tool: ${tool.name || 'unnamed'} missing required fields`);
        }
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

  const importFromGithub = () => {
    // Placeholder for GitHub import functionality
    alert('GitHub import functionality would be implemented here');
  };

  const importFromGist = () => {
    // Placeholder for Gist import functionality
    alert('Gist import functionality would be implemented here');
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
              className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500"
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
            onClick={importFromGithub}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              isDark 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Github className="w-4 h-4" />
            <span>Import from GitHub</span>
          </motion.button>

          <motion.button
            onClick={importFromGist}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              isDark 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            <span>Import from Gist</span>
          </motion.button>
        </div>

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
                className={`px-3 py-1 rounded-lg text-xs transition-all duration-300 ${
                  isDark 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {example.name}
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