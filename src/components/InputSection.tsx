import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Trash2, Sparkles } from 'lucide-react';

interface InputSectionProps {
  prompt: string;
  document: string;
  onPromptChange: (value: string) => void;
  onDocumentChange: (value: string) => void;
  onClear: () => void;
  isDark: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  prompt,
  document,
  onPromptChange,
  onDocumentChange,
  onClear,
  isDark
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onDocumentChange(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <motion.div 
      className={`rounded-3xl backdrop-blur-xl border transition-all duration-500 ${
        isDark 
          ? 'bg-gray-800/30 border-gray-700/50' 
          : 'bg-white/30 border-white/50'
      } shadow-2xl hover:shadow-3xl`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <FileText className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Input Configuration
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Configure your prompt and document for analysis
              </p>
            </div>
          </div>
          <motion.button
            onClick={onClear}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              isDark 
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30' 
                : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Inputs</span>
          </motion.button>
        </div>

        <div className="space-y-8">
          {/* Prompt Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className={`block text-sm font-semibold mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <Sparkles className="w-4 h-4 inline mr-2" />
              Prompt Input
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Enter your analysis prompt here..."
                className={`w-full h-32 px-6 py-4 rounded-2xl border-2 resize-none transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
              />
              <div className={`absolute bottom-3 right-3 text-xs ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {prompt.length} characters
              </div>
            </div>
          </motion.div>

          {/* Document Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-semibold ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <FileText className="w-4 h-4 inline mr-2" />
                Paste Document or Upload File
              </label>
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center space-x-2 px-3 py-1 rounded-xl text-sm transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50' 
                    : 'bg-gray-100/50 hover:bg-gray-200/50 text-gray-600 border border-gray-200/50'
                } backdrop-blur-sm`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="w-4 h-4" />
                <span>Upload .txt/.pdf</span>
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <div className="relative">
              <textarea
                value={document}
                onChange={(e) => onDocumentChange(e.target.value)}
                placeholder="Paste your document content here or upload a file..."
                className={`w-full h-64 px-6 py-4 rounded-2xl border-2 resize-none font-mono text-sm transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
              />
              <div className={`absolute bottom-3 right-3 text-xs ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {document.length} characters
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};