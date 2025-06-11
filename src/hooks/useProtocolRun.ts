import { useState } from 'react';

interface ProtocolRunRequest {
  prompt: string;
  document: string;
  protocols: string[];
  config: Record<string, any>;
}

export const useProtocolRun = () => {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runProtocols = async (request: ProtocolRunRequest) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/protocols/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to run protocols');
      }

      setResults(data);
      (window as any).showToast?.({ type: 'success', message: 'Protocols executed successfully!' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run protocols';
      setError(errorMessage);
      (window as any).showToast?.({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    runProtocols,
    results,
    isLoading,
    error
  };
};