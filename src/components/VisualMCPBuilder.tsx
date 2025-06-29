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
  HelpCircle
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
        <div className="flex space-x-2">
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
            onClick={exportSchema}
            disabled={hasErrors}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
              hasErrors
                ? isDark
                  ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed border border-gray-600/30'
                  : 'bg-gray-100/30 text-gray-400 cursor-not-allowed border border-gray-200/30'
                : isDark
                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
            } backdrop-blur-sm`}
            whileHover={!hasErrors ? { scale: 1.05 } : {}}
            whileTap={!hasErrors ? { scale: 0.95 } : {}}
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </motion.button>
        </div>
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
              className="space-y-6"
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

                <div className="space-y-4">
                  {tools.map((tool, index) => (
                    <motion.div
                      key={index}
                      className={`p-4 rounded-xl border-2 ${
                        editingTool === index
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
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                            <Zap className="w-4 h-4 text-white" />
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
                                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Parameters
                                </label>
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