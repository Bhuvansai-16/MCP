import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Info, 
  Zap, 
  Settings, 
  Eye, 
  Code,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sliders,
  Copy,
  Check,
  Move,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { MCPSchema } from '../App';

interface VisualMCPBuilderProps {
  isDark: boolean;
  initialSchema?: MCPSchema | null;
  onSchemaUpdate: (schema: MCPSchema) => void;
}

interface Tool {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

interface ValidationError {
  field: string;
  message: string;
}

const parameterTypes = [
  { value: 'string', label: 'Text (string)', description: 'Any text value' },
  { value: 'number', label: 'Number', description: 'Numeric value' },
  { value: 'boolean', label: 'True/False (boolean)', description: 'Boolean value' },
  { value: 'array', label: 'List (array)', description: 'Array of values' },
  { value: 'object', label: 'Object', description: 'Complex object' },
  { value: 'date', label: 'Date', description: 'Date value' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time value' }
];

export const VisualMCPBuilder: React.FC<VisualMCPBuilderProps> = ({
  isDark,
  initialSchema,
  onSchemaUpdate
}) => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [description, setDescription] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [editingTool, setEditingTool] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draggedToolIndex, setDraggedToolIndex] = useState<number | null>(null);
  const [dragOverToolIndex, setDragOverToolIndex] = useState<number | null>(null);
  const [showParameterHelp, setShowParameterHelp] = useState(false);

  // Load initial schema
  useEffect(() => {
    if (initialSchema) {
      setName(initialSchema.name);
      setVersion(initialSchema.version);
      setDescription(initialSchema.description || '');
      setTools(initialSchema.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      })));
    }
  }, [initialSchema]);

  // Validate and update schema
  useEffect(() => {
    const errors = validateSchema();
    setValidationErrors(errors);
    
    if (errors.length === 0 && name && tools.length > 0) {
      const schema: MCPSchema = {
        name,
        version,
        description,
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }))
      };
      onSchemaUpdate(schema);
    }
  }, [name, version, description, tools]);

  const validateSchema = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!name.trim()) {
      errors.push({ field: 'name', message: 'MCP name is required' });
    }

    if (!version.trim()) {
      errors.push({ field: 'version', message: 'Version is required' });
    }

    if (tools.length === 0) {
      errors.push({ field: 'tools', message: 'At least one tool is required' });
    }

    tools.forEach((tool, index) => {
      if (!tool.name.trim()) {
        errors.push({ field: `tool-${index}-name`, message: `Tool ${index + 1} name is required` });
      }
      if (!tool.description.trim()) {
        errors.push({ field: `tool-${index}-description`, message: `Tool ${index + 1} description is required` });
      }
    });

    return errors;
  };

  const addTool = () => {
    const newTool: Tool = {
      name: '',
      description: '',
      parameters: {}
    };
    setTools([...tools, newTool]);
    setEditingTool(tools.length);
  };

  const updateTool = (index: number, updatedTool: Tool) => {
    const newTools = [...tools];
    newTools[index] = updatedTool;
    setTools(newTools);
  };

  const deleteTool = (index: number) => {
    const newTools = tools.filter((_, i) => i !== index);
    setTools(newTools);
    if (editingTool === index) {
      setEditingTool(null);
    }
  };

  const addParameter = (toolIndex: number) => {
    const tool = tools[toolIndex];
    const paramName = `param_${Object.keys(tool.parameters).length + 1}`;
    updateTool(toolIndex, {
      ...tool,
      parameters: {
        ...tool.parameters,
        [paramName]: 'string'
      }
    });
  };

  const updateParameter = (toolIndex: number, oldName: string, newName: string, type: string) => {
    const tool = tools[toolIndex];
    const newParameters = { ...tool.parameters };
    
    if (oldName !== newName) {
      delete newParameters[oldName];
    }
    newParameters[newName] = type;
    
    updateTool(toolIndex, {
      ...tool,
      parameters: newParameters
    });
  };

  const deleteParameter = (toolIndex: number, paramName: string) => {
    const tool = tools[toolIndex];
    const newParameters = { ...tool.parameters };
    delete newParameters[paramName];
    
    updateTool(toolIndex, {
      ...tool,
      parameters: newParameters
    });
  };

  const generateExampleValues = () => {
    setName('example-mcp');
    setDescription('An example MCP for demonstration purposes');
    setTools([
      {
        name: 'get_data',
        description: 'Retrieve data from a source',
        parameters: {
          source: 'string',
          limit: 'number',
          format: 'string'
        }
      },
      {
        name: 'process_data',
        description: 'Process the retrieved data',
        parameters: {
          data: 'object',
          operation: 'string'
        }
      }
    ]);
  };

  const exportSchema = () => {
    const schema: MCPSchema = {
      name,
      version,
      description,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }))
    };
    
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'mcp'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const schema: MCPSchema = {
      name,
      version,
      description,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }))
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedToolIndex(index);
  };

  const handleDragOver = (index: number) => {
    setDragOverToolIndex(index);
  };

  const handleDrop = () => {
    if (draggedToolIndex === null || dragOverToolIndex === null || draggedToolIndex === dragOverToolIndex) {
      setDraggedToolIndex(null);
      setDragOverToolIndex(null);
      return;
    }
    
    const newTools = [...tools];
    const draggedTool = newTools[draggedToolIndex];
    
    // Remove the dragged tool
    newTools.splice(draggedToolIndex, 1);
    
    // Insert at the new position
    newTools.splice(dragOverToolIndex, 0, draggedTool);
    
    setTools(newTools);
    
    // Update editing tool index if needed
    if (editingTool === draggedToolIndex) {
      setEditingTool(dragOverToolIndex);
    }
    
    setDraggedToolIndex(null);
    setDragOverToolIndex(null);
  };

  const moveTool = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === tools.length - 1)) {
      return;
    }
    
    const newTools = [...tools];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap tools
    [newTools[index], newTools[targetIndex]] = [newTools[targetIndex], newTools[index]];
    
    setTools(newTools);
    
    // Update editing tool index if needed
    if (editingTool === index) {
      setEditingTool(targetIndex);
    } else if (editingTool === targetIndex) {
      setEditingTool(index);
    }
  };

  const getFieldError = (field: string) => {
    return validationErrors.find(error => error.field === field);
  };

  const hasErrors = validationErrors.length > 0;

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
              <Settings className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Visual MCP Builder
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Build MCPs with drag-and-drop interface
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Validation Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-xl ${
              hasErrors
                ? isDark
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-red-50 text-red-600 border border-red-200'
                : isDark
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-green-50 text-green-600 border border-green-200'
            }`}>
              {hasErrors ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {hasErrors ? `${validationErrors.length} errors` : 'Valid'}
              </span>
            </div>

            <motion.button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                showPreview
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
              {showPreview ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPreview ? 'Edit' : 'Preview'}</span>
            </motion.button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={generateExampleValues}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              isDark 
                ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-4 h-4" />
            <span>Generate Example</span>
          </motion.button>

          <motion.button
            onClick={copyToClipboard}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              copied
                ? isDark
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-green-50 text-green-600 border border-green-200'
                : isDark
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50'
                  : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
            } backdrop-blur-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </motion.button>

          <motion.button
            onClick={exportSchema}
            disabled={hasErrors}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              hasErrors
                ? isDark
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed border border-gray-600/30'
                  : 'bg-gray-100/30 text-gray-400 cursor-not-allowed border border-gray-200/30'
                : isDark
                  ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200'
            } backdrop-blur-sm`}
            whileHover={!hasErrors ? { scale: 1.05 } : {}}
            whileTap={!hasErrors ? { scale: 0.95 } : {}}
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </motion.button>

          <motion.button
            onClick={() => setShowParameterHelp(!showParameterHelp)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              showParameterHelp
                ? isDark
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
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

        {/* Parameter Help Panel */}
        <AnimatePresence>
          {showParameterHelp && (
            <motion.div
              className={`mt-4 p-4 rounded-xl ${
                isDark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50/50 border border-yellow-200/50'
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                Parameter Types Guide
              </h4>
              <div className={`text-sm space-y-2 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
                <p><strong>string:</strong> Text values like "hello" or "San Francisco"</p>
                <p><strong>number:</strong> Numeric values like 42 or 3.14</p>
                <p><strong>boolean:</strong> True/false values</p>
                <p><strong>array:</strong> Lists of values like ["item1", "item2"]</p>
                <p><strong>object:</strong> Complex nested data structures</p>
                <p><strong>date:</strong> Date values like "2023-12-25"</p>
                <p><strong>datetime:</strong> Date and time values like "2023-12-25T14:30:00Z"</p>
              </div>
              <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  <strong>Tip:</strong> Use descriptive parameter names that clearly indicate what the parameter is for. For example, use "location" instead of "loc" or "query" instead of "q".
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {showPreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-4 rounded-xl border max-h-full overflow-y-auto ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <pre className={`text-sm overflow-x-auto ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {JSON.stringify({
                  name,
                  version,
                  description,
                  tools: tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                  }))
                }, null, 2)}
              </pre>
            </motion.div>
          ) : (
            <motion.div
              key="builder"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 max-h-full overflow-y-auto pr-2"
            >
              {/* Basic Information */}
              <div className={`p-6 rounded-2xl ${
                isDark ? 'bg-gray-700/30' : 'bg-gray-100/30'
              } backdrop-blur-sm`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        MCP Name *
                      </label>
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 ${
                          isDark ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
                        } shadow-lg backdrop-blur-sm`}>
                          A unique identifier for your MCP. Use lowercase with hyphens.
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., weather-api"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                        getFieldError('name')
                          ? 'border-red-500 focus:border-red-500'
                          : isDark 
                            ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                            : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                      } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                    />
                    {getFieldError('name') && (
                      <p className="text-red-400 text-sm mt-1">{getFieldError('name')?.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Version *
                      </label>
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 ${
                          isDark ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
                        } shadow-lg backdrop-blur-sm`}>
                          Semantic version number (e.g., 1.0.0, 2.1.3)
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="1.0.0"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                        getFieldError('version')
                          ? 'border-red-500 focus:border-red-500'
                          : isDark 
                            ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                            : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                      } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                    />
                    {getFieldError('version') && (
                      <p className="text-red-400 text-sm mt-1">{getFieldError('version')?.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <div className="group relative">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 ${
                        isDark ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
                      } shadow-lg backdrop-blur-sm`}>
                        A brief description of what your MCP does
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what your MCP does..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border-2 resize-none transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                        : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                    } focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm`}
                  />
                </div>
              </div>

              {/* Tools Section */}
              <div className={`p-6 rounded-2xl ${
                isDark ? 'bg-gray-700/30' : 'bg-gray-100/30'
              } backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Tools ({tools.length})
                    </h3>
                    <div className="group relative">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 ${
                        isDark ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
                      } shadow-lg backdrop-blur-sm`}>
                        Tools are the functions your MCP provides. Each tool needs a name, description, and parameters.
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={addTool}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Tool</span>
                  </motion.button>
                </div>

                {getFieldError('tools') && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm">{getFieldError('tools')?.message}</p>
                  </div>
                )}

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  {tools.map((tool, index) => (
                    <motion.div
                      key={index}
                      className={`p-4 rounded-xl border-2 ${
                        dragOverToolIndex === index
                          ? isDark
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-purple-400 bg-purple-100'
                          : editingTool === index
                            ? isDark
                              ? 'border-purple-500/50 bg-purple-500/10'
                              : 'border-purple-400/50 bg-purple-50/50'
                            : isDark
                              ? 'border-gray-600/30 bg-gray-800/30'
                              : 'border-gray-200/30 bg-white/30'
                      } backdrop-blur-sm`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleDragOver(index);
                      }}
                      onDragEnd={handleDrop}
                      onDrop={handleDrop}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 cursor-move"
                               onMouseDown={() => handleDragStart(index)}>
                            <Move className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {tool.name || `Tool ${index + 1}`}
                            </h4>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {Object.keys(tool.parameters).length} parameters
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <motion.button
                              onClick={() => moveTool(index, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded-lg transition-colors ${
                                index === 0
                                  ? isDark
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-300 cursor-not-allowed'
                                  : isDark
                                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                              whileHover={index !== 0 ? { scale: 1.1 } : {}}
                              whileTap={index !== 0 ? { scale: 0.9 } : {}}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => moveTool(index, 'down')}
                              disabled={index === tools.length - 1}
                              className={`p-1 rounded-lg transition-colors ${
                                index === tools.length - 1
                                  ? isDark
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'text-gray-300 cursor-not-allowed'
                                  : isDark
                                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                              whileHover={index !== tools.length - 1 ? { scale: 1.1 } : {}}
                              whileTap={index !== tools.length - 1 ? { scale: 0.9 } : {}}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </motion.button>
                          </div>
                          <motion.button
                            onClick={() => setEditingTool(editingTool === index ? null : index)}
                            className={`p-2 rounded-lg transition-colors ${
                              editingTool === index
                                ? 'bg-purple-500 text-white'
                                : isDark
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => deleteTool(index)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {editingTool === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tool Name *
                                </label>
                                <input
                                  type="text"
                                  value={tool.name}
                                  onChange={(e) => updateTool(index, { ...tool, name: e.target.value })}
                                  placeholder="e.g., get_weather"
                                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
                                    getFieldError(`tool-${index}-name`)
                                      ? 'border-red-500 focus:border-red-500'
                                      : isDark 
                                        ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                                        : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                                  } focus:ring-2 focus:ring-purple-500/20`}
                                />
                                {getFieldError(`tool-${index}-name`) && (
                                  <p className="text-red-400 text-sm mt-1">{getFieldError(`tool-${index}-name`)?.message}</p>
                                )}
                              </div>
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Description *
                                </label>
                                <input
                                  type="text"
                                  value={tool.description}
                                  onChange={(e) => updateTool(index, { ...tool, description: e.target.value })}
                                  placeholder="What does this tool do?"
                                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 ${
                                    getFieldError(`tool-${index}-description`)
                                      ? 'border-red-500 focus:border-red-500'
                                      : isDark 
                                        ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                                        : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                                  } focus:ring-2 focus:ring-purple-500/20`}
                                />
                                {getFieldError(`tool-${index}-description`) && (
                                  <p className="text-red-400 text-sm mt-1">{getFieldError(`tool-${index}-description`)?.message}</p>
                                )}
                              </div>
                            </div>

                            {/* Parameters */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Parameters
                                  </label>
                                  <div className="group relative">
                                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                                    <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-48 ${
                                      isDark ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
                                    } shadow-lg backdrop-blur-sm`}>
                                      Parameters define the inputs your tool accepts. Each parameter needs a name and type.
                                    </div>
                                  </div>
                                </div>
                                <motion.button
                                  onClick={() => addParameter(index)}
                                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-all duration-300 ${
                                    isDark 
                                      ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30' 
                                      : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Parameter</span>
                                </motion.button>
                              </div>

                              <div className="space-y-2">
                                {Object.entries(tool.parameters).map(([paramName, paramType]) => (
                                  <div key={paramName} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={paramName}
                                      onChange={(e) => updateParameter(index, paramName, e.target.value, paramType)}
                                      placeholder="Parameter name"
                                      className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all duration-300 ${
                                        isDark 
                                          ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                                          : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                                      } focus:ring-2 focus:ring-purple-500/20`}
                                    />
                                    <select
                                      value={paramType}
                                      onChange={(e) => updateParameter(index, paramName, paramName, e.target.value)}
                                      className={`px-3 py-2 rounded-lg border text-sm transition-all duration-300 ${
                                        isDark 
                                          ? 'bg-gray-900/50 border-gray-600 text-white' 
                                          : 'bg-white/50 border-gray-200 text-gray-900'
                                      }`}
                                    >
                                      {parameterTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                          {type.label}
                                        </option>
                                      ))}
                                    </select>
                                    <motion.button
                                      onClick={() => deleteParameter(index, paramName)}
                                      className={`p-2 rounded-lg transition-colors ${
                                        isDark
                                          ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                      }`}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                  </div>
                                ))}
                              </div>

                              {Object.keys(tool.parameters).length === 0 && (
                                <div className={`p-3 rounded-lg text-center ${
                                  isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'
                                }`}>
                                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    No parameters yet. Click "Add Parameter" to add one.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Parameter Examples */}
                            <div className={`p-3 rounded-lg ${
                              isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'
                            }`}>
                              <div className="flex items-center space-x-2 mb-2">
                                <Sliders className="w-4 h-4 text-purple-500" />
                                <h5 className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                                  Parameter Examples
                                </h5>
                              </div>
                              <div className="space-y-1 text-xs">
                                <p className={isDark ? 'text-purple-300' : 'text-purple-600'}>
                                  <strong>location</strong> (string): "San Francisco, CA"
                                </p>
                                <p className={isDark ? 'text-purple-300' : 'text-purple-600'}>
                                  <strong>limit</strong> (number): 10
                                </p>
                                <p className={isDark ? 'text-purple-300' : 'text-purple-600'}>
                                  <strong>include_images</strong> (boolean): true
                                </p>
                                <p className={isDark ? 'text-purple-300' : 'text-purple-600'}>
                                  <strong>tags</strong> (array): ["news", "technology"]
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}

                  {tools.length === 0 && (
                    <div className="text-center py-8">
                      <Zap className={`w-12 h-12 mx-auto mb-4 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <h4 className={`text-lg font-semibold mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        No tools yet
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Add your first tool to get started
                      </p>
                      <motion.button
                        onClick={addTool}
                        className="mt-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg mx-auto"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Tool</span>
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};