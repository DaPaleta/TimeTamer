import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach access token to all requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  return api
    .post<AuthResponse>("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((res) => res.data);
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", {
    username,
    email,
    password,
  });
  return response.data;
}

export async function refreshToken(
  refresh_token: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/refresh", {
    refresh_token,
  });
  return response.data;
}

// --- Axios 401 Interceptor for Token Refresh ---
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('refresh_token')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const res = await refreshToken(localStorage.getItem('refresh_token')!);
            localStorage.setItem('access_token', res.access_token);
            localStorage.setItem('refresh_token', res.refresh_token);
            localStorage.setItem('expires_at', String(Date.now() + res.expires_in * 1000));
            isRefreshing = false;
            return res.access_token;
          } catch (err) {
            isRefreshing = false;
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('expires_at');
            window.location.href = '/login';
            return Promise.reject(err);
          }
        })();
      }
      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest._retry = true;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
