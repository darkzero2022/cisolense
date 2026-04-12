import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

const readCookie = (name: string): string | null => {
  const part = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!part) return null;
  return decodeURIComponent(part.split("=")[1] || "");
};

api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (method !== "get" && method !== "head" && method !== "options") {
    const csrf = readCookie("__Host-psifi.x-csrf-token") || readCookie("x-csrf-token");
    if (csrf) {
      config.headers = config.headers || {};
      config.headers["x-csrf-token"] = csrf;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(undefined)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && original.url !== "/auth/refresh") {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(() => api(original))
          .catch((e) => Promise.reject(e));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await api.post("/auth/refresh");
        await api.get("/auth/csrf").catch(() => {});
        processQueue(null);
        return api(original);
      } catch (e) {
        processQueue(e);
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
