import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ProtocolSelection } from './components/ProtocolSelection';
import { RunSection } from './components/RunSection';
import { ResultsSection } from './components/ResultsSection';
import { MetricsDashboard } from './components/MetricsDashboard';
import { ExportSection } from './components/ExportSection';
import { useTheme } from './hooks/useTheme';

export interface ProtocolResult {
  protocol: string;
  response: string;
  metrics: {
    tokens: number;
    latency: number;
    quality: number;
  };
}

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [document, setDocument] = useState('');
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(['raw', 'chain']);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProtocolResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const clearInputs = () => {
    setPrompt('');
    setDocument('');
    setResults([]);
    setLogs([]);
  };

  const runProtocols = async () => {
    if (!prompt.trim() || !document.trim() || selectedProtocols.length === 0) {
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setLogs(['Starting protocol execution...']);

    // Simulate protocol execution
    const mockResults: ProtocolResult[] = [];
    
    for (let i = 0; i < selectedProtocols.length; i++) {
      const protocol = selectedProtocols[i];
      setProgress(((i + 1) / selectedProtocols.length) * 100);
      setLogs(prev => [...prev, `Running ${protocol} protocol...`]);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result: ProtocolResult = {
        protocol,
        response: generateMockResponse(protocol, prompt, document),
        metrics: {
          tokens: Math.floor(Math.random() * 1000) + 200,
          latency: Math.floor(Math.random() * 2000) + 500,
          quality: Math.floor(Math.random() * 4) + 6
        }
      };
      
      mockResults.push(result);
      setLogs(prev => [...prev, `${protocol} protocol completed`]);
    }

    setResults(mockResults);
    setIsRunning(false);
    setLogs(prev => [...prev, 'All protocols completed successfully!']);
  };

  const generateMockResponse = (protocol: string, prompt: string, document: string) => {
    const responses = {
      raw: `Based on the provided document (${document.length} characters), I can provide a comprehensive analysis. ${prompt.substring(0, 100)}... The raw processing approach allows for maximum context retention and provides detailed insights by processing the entire document at once.`,
      chain: `Using sequential chaining, I've broken down your document into manageable chunks and processed them systematically. This approach ensures thorough coverage while maintaining context flow between segments.`,
      tree: `Through tree-of-thought processing, I've analyzed your document from multiple perspectives simultaneously. This parallel approach provides comprehensive coverage and diverse insights.`,
      rag: `Using retrieval-augmented generation, I've identified the most relevant sections of your document and focused the analysis on those key areas, providing targeted and efficient responses.`
    };
    
    return responses[protocol as keyof typeof responses] || `Mock response for ${protocol} protocol analyzing your prompt and document.`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <Header isDark={isDark} onToggleTheme={toggleTheme} />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <InputSection
              prompt={prompt}
              document={document}
              onPromptChange={setPrompt}
              onDocumentChange={setDocument}
              onClear={clearInputs}
              isDark={isDark}
            />
            
            <RunSection
              isRunning={isRunning}
              progress={progress}
              logs={logs}
              onRun={runProtocols}
              canRun={!isRunning && prompt.trim() && document.trim() && selectedProtocols.length > 0}
              isDark={isDark}
            />
          </div>
          
          <div>
            <ProtocolSelection
              selectedProtocols={selectedProtocols}
              onProtocolsChange={setSelectedProtocols}
              isDark={isDark}
            />
          </div>
        </div>

        {results.length > 0 && (
          <>
            <ResultsSection results={results} isDark={isDark} />
            <MetricsDashboard results={results} isDark={isDark} />
            <ExportSection results={results} isDark={isDark} />
          </>
        )}
      </main>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
}

export default App;