import axios from "axios";

/**
 * Resolves the API base URL dynamically based on environment:
 * 1. VITE_API_URL when explicitly configured.
 * 2. In production (PROD), defaults to "/api" (same-origin / reverse-proxy deployment).
 * 3. In local development, falls back to "http://localhost:8000/api".
 *
 * Normalizes trailing slashes and prevents duplicate "/api/api" prefixes.
 */
const resolveBaseUrl = () => {
  const envUrl = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }

  const isProd = typeof import.meta !== "undefined" && import.meta.env?.PROD;
  return isProd ? "/api" : "http://localhost:8000/api";
};

const axiosInstance = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle HTTP 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tripsync:session-expired"));
      }
    }
    // Do not hide the original error; calling components must detect error.response?.status === 401
    return Promise.reject(error);
  }
);

export default axiosInstance;