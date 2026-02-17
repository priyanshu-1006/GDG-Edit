/**
 * Immerse API Utility
 * Dedicated API client for Immerse mail system
 */

import axios from 'axios';
import { API_BASE_URL } from './apiUtils';

// Create axios instance for Immerse API
export const immerseApi = axios.create({
  baseURL: `${API_BASE_URL}/api/immerse`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include Immerse auth token
immerseApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('immerseToken');
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
immerseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('immerseToken');
      localStorage.removeItem('immerseAdmin');
      window.location.href = '/immerse/login';
    }
    return Promise.reject(error);
  }
);

// Helper functions for common Immerse API operations

export const immerseAuth = {
  login: (credentials) => immerseApi.post('/auth/login', credentials),
  getMe: () => immerseApi.get('/auth/me'),
  createAdmin: (data) => immerseApi.post('/auth/create-admin', data),
  getAdmins: () => immerseApi.get('/auth/admins'),
};

export const immerseContacts = {
  getAll: (params) => immerseApi.get('/contacts', { params }),
  create: (data) => immerseApi.post('/contacts', data),
  bulkImport: (contacts) => immerseApi.post('/contacts/bulk', { contacts }),
  update: (id, data) => immerseApi.put(`/contacts/${id}`, data),
  delete: (id) => immerseApi.delete(`/contacts/${id}`),
};

export const immerseTemplates = {
  getAll: (params) => immerseApi.get('/templates', { params }),
  create: (data) => immerseApi.post('/templates', data),
  update: (id, data) => immerseApi.put(`/templates/${id}`, data),
  delete: (id) => immerseApi.delete(`/templates/${id}`),
};

export const immerseEmail = {
  send: (data) => immerseApi.post('/email/send', data),
  sendWithTemplate: (data) => immerseApi.post('/email/send-template', data),
  sendBulk: (data) => immerseApi.post('/email/send-bulk', data),
  sendSponsor: (data) => immerseApi.post('/email/send-sponsor', data),
  getLogs: (params) => immerseApi.get('/email/logs', { params }),
  getStats: (params) => immerseApi.get('/email/stats', { params }),
};

export const immerseDashboard = {
  getStats: () => immerseApi.get('/dashboard/stats'),
};

export default immerseApi;
