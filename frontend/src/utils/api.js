import axios from 'axios';

// ✅ No hardcoded IP fallback — forces proper .env setup
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.error('[api.js] VITE_API_BASE_URL is not set! Check your .env file.');
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor — attach Firebase JWT token ─────────────────────
// ✅ Single interceptor only (duplicate removed)
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

// ─── Response interceptor — handle 401 auto-logout ───────────────────────
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

export default api;