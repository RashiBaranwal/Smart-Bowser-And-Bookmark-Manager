import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const browserHistoryAPI = {
  // Get all browser history with optional filters
  getAll: (params = {}) => api.get('/browser-history', { params }),

  // Get statistics
  getStats: () => api.get('/browser-history/stats'),

  // Delete specific entry
  delete: (id) => api.delete(`/browser-history/${id}`),

  // Delete all entries
  deleteAll: () => api.delete('/browser-history'),
};

export const bookmarkAPI = {
  // Get all bookmarks with optional filters
  getAll: (params = {}) => api.get('/bookmarks', { params }),

  // Get statistics
  getStats: () => api.get('/bookmarks/stats'),

  // Instant search bookmarks
  search: (query) => api.get('/bookmarks/search', { params: { q: query } }),

  // Get folders list
  getFolders: () => api.get('/bookmarks/folders'),

  // Delete specific entry
  delete: (id) => api.delete(`/bookmarks/${id}`),

  // Delete all entries
  deleteAll: () => api.delete('/bookmarks'),
};

export const manualEntryAPI = {
  // Get all manual entries with optional filters
  getAll: (params = {}) => api.get('/manual-entries', { params }),

  // Get statistics
  getStats: () => api.get('/manual-entries/stats'),

  // Instant search manual entries
  search: (query) => api.get('/manual-entries/search', { params: { q: query } }),

  // Create new manual entry
  create: (data) => api.post('/manual-entries', data),

  // Update manual entry
  update: (id, data) => api.put(`/manual-entries/${id}`, data),

  // Delete specific entry
  delete: (id) => api.delete(`/manual-entries/${id}`),

  // Delete all entries
  deleteAll: () => api.delete('/manual-entries'),
};

export default api;
