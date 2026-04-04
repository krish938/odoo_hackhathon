import { useEffect, useRef, useState } from 'react';

export const usePolling = (fetchFunction, interval = 5000, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchData = async () => {
    try {
      if (!mountedRef.current) return;
      
      setLoading(true);
      const result = await fetchFunction();
      
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        console.error('Polling error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Initial fetch
    fetchData();
    
    // Set up interval
    intervalRef.current = setInterval(fetchData, interval);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startPolling();
    
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [interval, ...dependencies]);

  // Manual refresh function
  const refresh = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling,
  };
};
