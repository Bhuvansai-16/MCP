import { useState } from 'react';

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

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/api/metrics/summary`;
      
      console.log('Fetching metrics from:', url);
      
      const response = await fetch(url, {
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