import React, { useRef } from 'react';
import { FileText, Upload, Trash2 } from 'lucide-react';

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
    <div className={`rounded-2xl shadow-xl border transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white/80 backdrop-blur-sm border-white/20'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Input Configuration
            </h2>
          </div>
          <button
            onClick={onClear}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Inputs</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Prompt Input */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Prompt Input
            </label>
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Enter your analysis prompt here..."
              className={`w-full h-32 px-4 py-3 rounded-xl border-2 resize-none transition-all duration-200 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500/20`}
            />
            <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {prompt.length} characters
            </div>
          </div>

          {/* Document Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-semibold ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Paste Document or Upload File
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload .txt/.pdf</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <textarea
              value={document}
              onChange={(e) => onDocumentChange(e.target.value)}
              placeholder="Paste your document content here or upload a file..."
              className={`w-full h-64 px-4 py-3 rounded-xl border-2 resize-none font-mono text-sm transition-all duration-200 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:ring-2 focus:ring-blue-500/20`}
            />
            <div className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {document.length} characters
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};