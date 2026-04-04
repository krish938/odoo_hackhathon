import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors and global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - Clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_auth');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
      return Promise.reject(error);
    }

    // Handle 400 validation / bad request (show first field error when present)
    if (error.response?.status === 400) {
      const data = error.response.data;
      if (Array.isArray(data?.details) && data.details.length > 0) {
        const first = data.details.find((d) => d?.message)?.message;
        toast.error(first || data.message || 'Invalid input');
      } else if (data?.message && typeof data.message === 'string') {
        toast.error(data.message);
      } else {
        toast.error('Invalid request. Please check your input.');
      }
      return Promise.reject(error);
    }

    // Handle 409 Conflict (e.g. duplicate email)
    if (error.response?.status === 409) {
      const msg =
        error.response?.data?.message || error.response?.data?.error;
      toast.error(typeof msg === 'string' ? msg : 'This resource already exists.');
      return Promise.reject(error);
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      toast.error('Connection failed. Check your internet connection.');
      return Promise.reject(error);
    }

    // Handle specific error messages from backend
    const apiMessage =
      error.response?.data?.message || error.response?.data?.error;
    if (apiMessage && typeof apiMessage === 'string') {
      toast.error(apiMessage);
      return Promise.reject(error);
    }

    // Default error handling
    toast.error('An error occurred. Please try again.');
    return Promise.reject(error);
  }
);

export default api;
