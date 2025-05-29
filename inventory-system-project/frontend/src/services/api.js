import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout
  timeout: 10000
});

// Add request interceptor to include auth token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle specific error cases
      if (error.response.status === 401) {
        // Unauthorized - could be invalid credentials or expired token
        const errorMessage = error.response.data?.message || 'Invalid credentials';
        return Promise.reject({
          ...error,
          response: {
            ...error.response,
            data: {
              message: errorMessage
            }
          }
        });
      }
      
      if (error.response.status === 404) {
        // Not found - user doesn't exist
        return Promise.reject({
          ...error,
          response: {
            ...error.response,
            data: {
              message: error.response.data?.message || 'User not found'
            }
          }
        });
      }
      
      // Return the original error for other cases
      return Promise.reject(error);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.request);
      return Promise.reject({ message: 'Network error occurred. Please check your connection.' });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

// Authentication services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile')
};

// Inventory services
export const inventoryService = {
  getAllItems: () => api.get('/inventory'),
  getInventoryByDate: (date) => api.get('/inventory/by-date', { params: { date } }),
  getLowStockItems: () => api.get('/inventory/low-stock'),
  getItemById: (id) => api.get(`/inventory/${id}`),
  createItem: (itemData) => api.post('/inventory', itemData),
  updateItem: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  deleteItem: (id) => api.delete(`/inventory/${id}`),
  updateInventoryWithTransactions: (updateData) => api.post('/inventory/update-inventory', updateData)
};

// Category services
export const categoryService = {
  getAllCategories: () => api.get('/categories'),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

// Transaction services
export const transactionService = {
  getAllTransactions: (params) => api.get('/transactions', { params }),
  createTransaction: (transactionData) => api.post('/transactions', transactionData),
  createInventoryTransaction: (transactionData) => api.post('/transactions/inventory', transactionData),
  getDashboardStats: (date) => api.get('/transactions/dashboard', { params: date ? { date } : {} }),
  getStatistics: (params) => api.get('/transactions/statistics', { params }),
  getTopOutgoingProducts: (params) => api.get('/transactions/top-outgoing', { params }),
  updateInventoryForDate: (data) => api.post('/transactions/update-inventory', data),
  resetQuantity: (inventoryItemId) => api.post('/transactions/reset-quantity', { inventoryItemId })
};

// Settings services
export const settingsService = {
  getAllSettings: () => api.get('/settings'),
  getSetting: (key) => api.get(`/settings/${key}`),
  updateSetting: (key, settingData) => api.put(`/settings/${key}`, settingData),
  updateSettings: (settings) => api.put('/settings', { settings }),
  deleteSetting: (key) => api.delete(`/settings/${key}`)
};

// User management services
export const userService = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get('/users/stats'),
  changeUserPassword: (id, passwordData) => api.put(`/users/${id}/password`, passwordData)
};

// Daily inventory services
export const dailyInventoryService = {
  generateTodayInventory: () => api.get('/daily-inventory/generate'),
  getDailyInventory: (date, params) => api.get(`/daily-inventory/${date}`, { params }),
  updateDailyInventory: (id, entryData) => api.put(`/daily-inventory/${id}`, entryData),
  updateMultipleDailyInventory: (entries) => api.put('/daily-inventory', { entries }),
  getDailyInventorySummary: (params) => api.get('/daily-inventory/summary', { params })
};

export default api; 