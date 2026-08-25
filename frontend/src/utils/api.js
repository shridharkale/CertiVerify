import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('[api.js] VITE_API_BASE_URL is not set; using /api (Vite proxy / production reverse proxy).');
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getApiError(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  if (typeof data?.error === 'string' && data.error) return data.error;
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (error?.message) return error.message;
  return fallback;
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cv_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      window.dispatchEvent(new CustomEvent('api-network-error'));
    }

    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('cv_token');
      localStorage.removeItem('cv_user');
      window.location.hash = '#/login';
    }

    return Promise.reject(error);
  }
);

export default api;

export async function verifyCertificate(query) {
  const res = await api.get('/verify/' + encodeURIComponent(query));
  return res.data;
}
