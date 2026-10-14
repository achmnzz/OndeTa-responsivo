import { useCallback, useState } from 'react';
import api from '../services/api';

export function useMap() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPins = useCallback(async ({ latitude, longitude, distance = 50, petType, category } = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/posts/pins', {
        params: {
          latitude,
          longitude,
          distance,
          pet_type: petType || undefined,
          category: category || undefined,
        },
      });
      setPins(response.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao carregar o mapa');
    } finally {
      setLoading(false);
    }
  }, []);

  return { pins, loading, error, fetchPins };
}
