import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useExcusas(initialFilters = {}) {
  const [excusas, setExcusas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchExcusas = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExcusas(currentFilters);
      if (data.success) {
        setExcusas(data.excusas);
      } else {
        throw new Error(data.message || 'Error cargando excusas');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExcusas(filters);
  }, [filters, fetchExcusas]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = (defaultFilters = {}) => {
    setFilters(defaultFilters);
  };

  return {
    excusas,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch: () => fetchExcusas(filters)
  };
}
