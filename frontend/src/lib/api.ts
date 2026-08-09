import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Authorization Bearer header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('neuroai_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for error handling
// Set `config.silent = true` on a request to suppress the auto toast.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    // Auto-logout on 401 Unauthorized for authenticated endpoints
    if (error.response?.status === 401 && !isLoginEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem('neuroai_token');
      localStorage.removeItem('neuroai_user');
      useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
      // Only reload if we are not already on the login or landing page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    const isSilent = error.config?.silent === true;
    if (!isSilent) {
      const detailMsg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : typeof error.response?.data === 'string'
        ? error.response.data
        : error.message || 'An unexpected error occurred';

      console.error('API Error:', detailMsg);
      toast.error(`API Error: ${detailMsg}`, {
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }
      });
    }
    return Promise.reject(error);
  }
);
