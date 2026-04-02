import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from sessionStorage to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const auth = {
  login: (email, password, role) => api.post('/auth/login', { email, password, role }),
  register: (email, password, name, role) => api.post('/auth/register', { email, password, name, role }),
  registerOfficial: (email, password, name, role) => api.post('/auth/register-official', { email, password, name, role }),
  requestResetPassword: (email) => api.post('/auth/request-reset-password', { email }),
  getResetPasswordStatus: (email) => api.get('/auth/reset-password-status', { params: { email } }),
  resetPassword: (email, requestId, newPassword) =>
    api.post('/auth/reset-password', { email, requestId, newPassword }),
  pendingResetRequests: () => api.get('/auth/pending-reset-requests'),
  approveResetPassword: (requestId) => api.post('/auth/approve-reset-password', { requestId }),
  rejectResetPassword: (requestId) => api.post('/auth/reject-reset-password', { requestId }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
};

export const notifications = {
  list: () => api.get('/notifications'),
  markRead: (ids) => api.post('/notifications/mark-read', { ids }),
};

export const analytics = {
  dashboard: () => api.get('/analytics/dashboard'),
};

// REST resources
export const users = {
  list: () => api.get('/users'),
  self: () => api.get('/users/self'),
  search: (q) => api.get('/users/search', { params: { q } }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
  approve: (id) => api.post(`/users/${id}/approve`),
  reject: (id) => api.post(`/users/${id}/reject`),
};

export const categories = {
  list: (params) => api.get('/categories', { params }),
  get: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
};

export const docs = {
  get: (id) => api.get(`/docs/${id}`),
  create: (data) => api.post('/docs', data),
  update: (id, data) => api.patch(`/docs/${id}`, data),
};

export const forums = {
  list: () => api.get('/forums'),
  get: (id, params) => api.get(`/forums/${id}`, { params }),
  create: (data) => api.post('/forums', data),
  update: (id, data) => api.patch(`/forums/${id}`, data),
};

export const topics = {
  list: (params) => api.get('/topics', { params }),
  get: (id) => api.get(`/topics/${id}`),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.patch(`/topics/${id}`, data),
};

export const tickets = {
  list: (params) => api.get('/topics', { params }),
  get: (id) => api.get(`/topics/${id}`),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.patch(`/topics/${id}`, data),
};

export const posts = {
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.patch(`/posts/${id}`, data),
};

export const search = {
  run: (q, params) => api.get('/search', { params: { q, ...params } }),
};

export const upload = {
  file: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
