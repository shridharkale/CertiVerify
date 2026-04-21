import axios from 'axios';

// ─── Base URL ───────────────────────────────────────────────────────────
// For GitHub Pages: set VITE_API_BASE_URL in frontend/.env
// For local dev:    set VITE_API_BASE_URL=http://192.168.1.134:5000/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.134:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor — attach JWT token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cv_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cv_token');
      localStorage.removeItem('cv_user');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(config => {
  const token = localStorage.getItem('cv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;