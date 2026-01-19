import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔗 Connecting to API:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
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

// Helper to get cache key
const getCacheKey = (url, params) => {
  if (!url) return null;
  const queryString = params ? JSON.stringify(params) : '';
  return `CACHE_${url}_${queryString}`;
};

// Response interceptor to handle errors and cache data
api.interceptors.response.use(
  (response) => {
    // CACHE SUCCESSFUL GET REQUESTS
    if (response.config.method === 'get' && response.data) {
       try {
         const key = getCacheKey(response.config.url, response.config.params);
         if (key) {
           localStorage.setItem(key, JSON.stringify({
             timestamp: Date.now(),
             data: response.data
           }));
         }
       } catch (e) {
         console.warn('Cache save failed', e);
       }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // OFFLINE FALLBACK
    if (!error.response && error.code === "ERR_NETWORK" && originalRequest.method === 'get') {
      try {
        const key = getCacheKey(originalRequest.url, originalRequest.params);
        const cachedItem = localStorage.getItem(key);
        
        if (cachedItem) {
          const { data } = JSON.parse(cachedItem);
          console.log('Serving from cache:', key);
          // Return cached data as if it were a successful response
          return Promise.resolve({
            data: data,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config: originalRequest,
            isCached: true // Flag to indicate cached data
          });
        }
      } catch (e) {
        console.error('Cache retrieval failed', e);
      }
    }

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Customer API
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  bulkUpload: (formData) => api.post('/customers/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStats: () => api.get('/customers/stats'),
  getAreas: () => api.get('/customers/areas'),
};

// Bill API
export const billAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  getByCustomer: (customerId) => api.get(`/bills/customer/${customerId}`),
  generate: (data) => api.post('/bills/generate', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  getStats: (params) => api.get('/bills/stats', { params }),
  getRevenueTrend: (params) => api.get('/bills/revenue-trend', { params }),
};

// Payment API
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  getByCustomer: (customerId) => api.get(`/payments/customer/${customerId}`),
  create: (data) => api.post('/payments', data),
  resendReceipt: (id) => api.post(`/payments/${id}/resend-receipt`),
  downloadReceipt: (id) => api.get(`/payments/${id}/download-receipt`, { responseType: 'blob' }),
  getStats: (params) => api.get('/payments/stats', { params }),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  reset: () => api.post('/settings/reset'),
};

// Admin Management API
export const adminAPI = {
  getAll: () => api.get('/admins'),
  create: (data) => api.post('/admins', data),
  update: (id, data) => api.put(`/admins/${id}`, data),
  delete: (id) => api.delete(`/admins/${id}`),
};

// Public Customer Portal API (no auth required)
export const portalAPI = {
  lookup: (phoneNumber) => api.post('/portal/lookup', { phoneNumber }),
  getBillDetails: (billId, phoneNumber) => api.post(`/portal/bill/${billId}`, { phoneNumber }),
};

export default api;
