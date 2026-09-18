import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
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