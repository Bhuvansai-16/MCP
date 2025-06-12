import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { InputSection } from './InputSection';
import { ProtocolSelection } from './ProtocolSelection';
import { RunSection } from './RunSection';
import { ResultsSection } from './ResultsSection';
import { MetricsDashboard } from './MetricsDashboard';
import { ExportSection } from './ExportSection';
import { ProtocolResult } from '../App';

interface PlaygroundViewProps {
  isDark: boolean;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ isDark }) => {
  const [prompt, setPrompt] = useState('Analyze the key themes and provide actionable insights from this document.');
  const [document, setDocument] = useState(`# Sample Document for MCP Testing

This is a comprehensive document that demonstrates the capabilities of different Model Context Protocol implementations. 

## Key Concepts

The Model Context Protocol (MCP) represents a significant advancement in how we handle large-scale document processing and analysis.

## Implementation Strategies

### Raw Processing
Direct processing with full context provides maximum information retention.

### Chain Processing  
Sequential chunk processing allows handling of larger documents.

### Tree Processing
Parallel branch analysis enables multi-perspective examination.

### RAG Processing
Retrieval-augmented generation focuses on the most relevant content.

## Conclusion

The MCP Playground provides a powerful environment for testing and comparing these different approaches.`);
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
    setLogs(['🚀 Initializing protocol execution...']);

    const mockResults: ProtocolResult[] = [];
    
    for (let i = 0; i < selectedProtocols.length; i++) {
      const protocol = selectedProtocols[i];
      setProgress(((i + 1) / selectedProtocols.length) * 100);
      setLogs(prev => [...prev, `⚡ Running ${protocol} protocol...`]);
      
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
      setLogs(prev => [...prev, `✅ ${protocol} protocol completed`]);
    }

    setResults(mockResults);
    setIsRunning(false);
    setLogs(prev => [...prev, '🎉 All protocols completed successfully!']);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="container mx-auto px-6 py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div className="lg:col-span-2 space-y-8" variants={itemVariants}>
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
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <ProtocolSelection
            selectedProtocols={selectedProtocols}
            onProtocolsChange={setSelectedProtocols}
            isDark={isDark}
          />
        </motion.div>
      </div>

      {results.length > 0 && (
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ResultsSection results={results} isDark={isDark} />
          <MetricsDashboard results={results} isDark={isDark} />
          <ExportSection results={results} isDark={isDark} />
        </motion.div>
      )}
    </motion.div>
  );
};