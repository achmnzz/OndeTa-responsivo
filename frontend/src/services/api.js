import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const STORAGE_KEY = '@App:user';

export function getStoredSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredSession()?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const SESSION_ERROR_MESSAGES = [
  'Token inválido, expirado ou ausente.',
  'Acesso negado. Origem da requisição inválida.',
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const hasSession = Boolean(getStoredSession()?.access_token);

    const isSessionError =
      hasSession &&
      ((status === 401 && (data?.msg || SESSION_ERROR_MESSAGES.includes(data?.message))) ||
        (status === 422 && data?.msg));

    if (isSessionError) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.assign(`${import.meta.env.BASE_URL}login?sessao=expirada`);
      return new Promise(() => {});
    }

    return Promise.reject(error);
  }
);

export default api;
