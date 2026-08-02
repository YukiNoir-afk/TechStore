import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';
const BASE_URL = `${API_URL}/${API_VERSION}`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Products API
export const productsApi = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  search: (q) => api.get('/products/search', { params: { q } }),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getProducts: (slug, params = {}) => api.get(`/categories/${slug}/products`, { params }),
};

// Cart API
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }),
  updateItem: (id, quantity) => api.put(`/cart/items/${id}`, { quantity }),
  removeItem: (id) => api.delete(`/cart/items/${id}`),
  clear: () => api.delete('/cart/clear'),
};

// Orders API
export const ordersApi = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  cancelPaymentOrder: (id) => api.post(`/orders/${id}/cancel-payment`),
  lookupByPhone: (phone) => api.get('/orders/lookup-by-phone', { params: { phone } }),
};

// Wishlist API
export const wishlistApi = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist', { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

// Reviews API
export const reviewsApi = {
  getForProduct: (productId) => api.get(`/products/${productId}/reviews`),
  create: (productId, data) => api.post(`/products/${productId}/reviews`, data),
  checkEligibility: (productId) => api.get(`/products/${productId}/reviews/eligibility`),
};

// Payments API
export const paymentsApi = {
  createIntent: (amount, currency = 'vnd') =>
    api.post('/payments/create-intent', { amount, currency }),
  getConfig: () => api.get('/payments/config'),
  createMomoPayment: (orderId, requestType) => api.post('/payments/momo/create', { orderId, requestType }),
  createVnPayPayment: (orderId) => api.post('/payments/vnpay/create', { orderId }),
};

// Chatbot API
export const chatbotApi = {
  sendMessage: (message) => api.post('/chatbot/message', { message }),
};

// Recommendations API
export const recommendationsApi = {
  getPersonal: (limit = 8) => api.get('/recommendations', { params: { limit } }),
  getRelated: (productId, limit = 8) => api.get(`/recommendations/${productId}`, { params: { limit } }),
  trackView: (productId) => api.post('/recommendations/viewed', { productId }),
};

// Product Questions API
export const questionsApi = {
  getForProduct: (productId) => api.get(`/products/${productId}/questions`),
  create: (productId, data) => api.post(`/products/${productId}/questions`, data),
  answer: (productId, questionId, data) => api.post(`/products/${productId}/questions/${questionId}/answers`, data),
};

// Support Tickets API
export const supportApi = {
  getTickets: () => api.get('/support'),
  createTicket: (data) => api.post('/support', data),
  replyTicket: (id, data) => api.post(`/support/${id}/reply`, data),
};

// Profile API
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  changePassword: (data) => api.put('/profile/password', data),
  getAddresses: () => api.get('/profile/addresses'),
  addAddress: (data) => api.post('/profile/addresses', data),
  updateAddress: (id, data) => api.put(`/profile/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/profile/addresses/${id}`),
  setDefaultAddress: (id) => api.put(`/profile/addresses/${id}/default`),
};

// Vouchers API (Loyalty Vouchers)
export const vouchersApi = {
  getAll: () => api.get('/vouchers'),
  validate: (code) => api.post('/vouchers/validate', { code }),
  getCatalog: () => api.get('/vouchers/catalog'),
  claim: (templateId) => api.post(`/vouchers/claim/${templateId}`),
};

// Promo Code API (public)
export const promoApi = {
  validate: (code) => api.post('/promo/validate', { code }),
};

// Live Chat API
export const liveChatApi = {
  startConversation: () => api.post('/livechat/conversations'),
  getConversations: () => api.get('/livechat/conversations'),
  getMessages: (conversationId) => api.get(`/livechat/conversations/${conversationId}/messages`),
  markAsRead: (conversationId) => api.post(`/livechat/conversations/${conversationId}/read`),
};

export default api;
