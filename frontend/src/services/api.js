import axios from 'axios';
import useAuthStore from '@/stores/authStore';

let apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
if (apiBaseUrl !== '/api' && !apiBaseUrl.endsWith('/api')) {
  apiBaseUrl = apiBaseUrl.replace(/\/$/, '') + '/api';
}

/**
 * Axios instance with JWT auth interceptor and 401 redirect
 */
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const oldRefreshToken = useAuthStore.getState().refreshToken;
          if (!oldRefreshToken) {
            useAuthStore.getState().logout();
            window.location.href = '/login?expired=true';
            return Promise.reject(error);
          }
          const res = await axios.post(`${apiBaseUrl}/auth/refresh`, { refreshToken: oldRefreshToken });
          const { accessToken: newToken, refreshToken: newRefreshToken } = res.data.data;
          useAuthStore.getState().setToken(newToken, newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = '/login?expired=true';
          return Promise.reject(refreshError);
        }
      } else {
        // If it's already a retry request and still returns 401, refresh token was invalid
        useAuthStore.getState().logout();
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
