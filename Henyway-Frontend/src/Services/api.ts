import axios from 'axios';
import { apiConfig } from './api-config';

// Create a centralized Axios instance
const api = axios.create({
  baseURL: apiConfig.getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        config.headers = {
          'Authorization': `Bearer ${token}`
        } as any;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
