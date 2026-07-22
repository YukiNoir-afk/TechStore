import axios from 'axios';
import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';
const BASE_URL = `${API_URL}/${API_VERSION}/admin`;

const adminAxios = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminApi = {
  // Dashboard
  getDashboard: () => adminAxios.get('/dashboard'),

  // Orders
  getOrders: (status) => adminAxios.get('/orders', { params: status ? { status } : {} }),
  updateOrderStatus: (id, data) => adminAxios.put(`/orders/${id}/status`, data),

  // Products
  getProducts: (search) => adminAxios.get('/products', { params: search ? { search } : {} }),
  createProduct: (data) => adminAxios.post('/products', data),
  updateProduct: (id, data) => adminAxios.put(`/products/${id}`, data),
  toggleProduct: (id) => adminAxios.patch(`/products/${id}/toggle`),

  // Users
  getUsers: () => adminAxios.get('/users'),
  lockUser: (id, data) => adminAxios.put(`/users/${id}/lock`, data),
  unlockUser: (id) => adminAxios.put(`/users/${id}/unlock`),
  deleteUser: (id) => adminAxios.delete(`/users/${id}`),

  // Order History by Phone
  getOrdersByPhone: (phone) => adminAxios.get('/orders/by-phone', { params: { phone } }),

  // Categories
  getCategories: () => adminAxios.get('/categories'),
  createCategory: (data) => adminAxios.post('/categories', data),
  updateCategory: (id, data) => adminAxios.put(`/categories/${id}`, data),
  deleteCategory: (id) => adminAxios.delete(`/categories/${id}`),

  // Inventory
  getStockTransactions: (params) => adminAxios.get('/stock-transactions', { params }),
  createStockTransaction: (data) => adminAxios.post('/stock-transactions', data),

  // Promo Codes
  getPromoCodes: () => adminAxios.get('/promo-codes'),
  createPromoCode: (data) => adminAxios.post('/promo-codes', data),
  updatePromoCode: (id, data) => adminAxios.put(`/promo-codes/${id}`, data),
  deletePromoCode: (id) => adminAxios.delete(`/promo-codes/${id}`),

  // Customer Care: Reviews
  getReviews: () => adminAxios.get('/reviews'),
  deleteReview: (id) => adminAxios.delete(`/reviews/${id}`),

  // Customer Care: Support Tickets
  getSupportTickets: (params = {}) => adminAxios.get('/support-tickets', { params }),
  replyToTicket: (id, data) => adminAxios.post(`/support-tickets/${id}/reply`, data),
  updateTicketStatus: (id, data) => adminAxios.patch(`/support-tickets/${id}/status`, data),

  // Customer Care: Live Chat
  getLiveChatConversations: () => api.get('/livechat/conversations'),
  getLiveChatMessages: (conversationId) => api.get(`/livechat/conversations/${conversationId}/messages`),
  closeLiveChatConversation: (id) => api.patch(`/livechat/conversations/${id}/close`),
  markLiveChatRead: (conversationId) => api.post(`/livechat/conversations/${conversationId}/read`),

  // Image Upload
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default adminApi;
