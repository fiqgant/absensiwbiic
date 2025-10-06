import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("admin_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("admin_token");
    }
    return Promise.reject(err);
  }
);
