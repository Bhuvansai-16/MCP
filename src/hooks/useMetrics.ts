import { useState } from 'react';

const API_BASE_URL = 'http://localhost:3001';

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      console.log('Fetching metrics from:', `${API_BASE_URL}/api/metrics/summary`);
      
      const response = await fetch(`${API_BASE_URL}/api/metrics/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Metrics response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Server error: ${response.status}`);
      }

      setMetrics(data);
    } catch (err) {
      console.error('Metrics fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    loading,
    error,
    fetchMetrics
  };
};