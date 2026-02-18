/**
 * Axios API Service
 * Configured instance with JWT auth interceptor and error handling
 */

import axios from "axios";
import toast from "react-hot-toast";

const url = `${import.meta.env.VITE_BACKEND_URL}/api`;

console.log(url);
const api = axios.create({
  baseURL: url,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Request Interceptor: Attach JWT ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Handle errors globally ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    const status = error.response?.status;

    // Handle unauthorized (expired token)
    if (status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    } else if (status >= 500) {
      toast.error("Server error. Please try again.");
    }

    return Promise.reject(error);
  },
);

export default api;
