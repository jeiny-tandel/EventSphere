import axios from 'axios';
import { getAccessToken } from '../utils/token.utils.ts';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
