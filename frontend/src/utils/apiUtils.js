/**
 * API Utility Functions
 * Centralized API configuration and helper functions
 */

import axios from 'axios';

// Get API Base URL from environment variable
// Automatically uses production URL when deployed, localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Helper function to get auth token
export const getAuthToken = () => localStorage.getItem('token');

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API endpoint builder
export const buildApiUrl = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// OAuth redirect helper
export const initiateOAuth = (provider) => {
  window.location.href = buildApiUrl(`api/auth/${provider}`);
};

export default {
  API_BASE_URL,
  FRONTEND_URL,
  apiClient,
  getAuthToken,
  getAuthHeaders,
  buildApiUrl,
  initiateOAuth,
};
