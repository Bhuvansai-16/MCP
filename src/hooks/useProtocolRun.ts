import { useState } from 'react';

interface ProtocolRunRequest {
  prompt: string;
  document: string;
  protocols: string[];
  config: Record<string, any>;
}

// Dynamic API base URL detection
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('webcontainer-api.io')) {
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        const prefix = parts[0];
        const suffix = parts.slice(1).join('.');
        return `https://${prefix}--3001--${suffix}`;
      }
    }
  }
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

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
      const url = `${API_BASE_URL}/api/protocols/run`;
      
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Server error: ${response.status}`);
      }

      setResults(data);
      (window as any).showToast?.({ type: 'success', message: 'Protocols executed successfully!' });
    } catch (err) {
      console.error('Protocol run error:', err);
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