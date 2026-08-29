import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cv_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) window.dispatchEvent(new CustomEvent("api-network-error"));
    if (error.response?.status === 401) {
      localStorage.removeItem("cv_token");
      localStorage.removeItem("cv_user");
      window.location.href = "/#/login";
    }
    return Promise.reject(error);
  }
);

export async function verifyCertificate(query) {
  const res = await api.get("/api/verify/" + query);
  return res.data;
}

export async function getCertificates() {
  const res = await api.get("/api/certificates");
  return res.data;
}

export async function getCertificate(certId) {
  const res = await api.get("/api/certificates/" + certId);
  return res.data;
}

export async function getEvents() {
  const res = await api.get("/api/certificates/events");
  return res.data;
}

export async function getStats() {
  const res = await api.get("/api/certificates/public-stats");
  return res.data;
}

export async function issueCertificates(formData) {
  const res = await api.post("/api/certificates/issue", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export default api;

export function getApiError(err) { return err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Something went wrong'; }
