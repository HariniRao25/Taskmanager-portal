import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('teamflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('teamflow_token');
      localStorage.removeItem('teamflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  getUsers: () => API.get('/auth/users'),
  updateProfile: (data) => API.put('/auth/me', data),
};

// Projects
export const projectsAPI = {
  getAll: () => API.get('/projects'),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  getStats: (id) => API.get(`/projects/${id}/stats`),
};

// Tasks
export const tasksAPI = {
  getAll: (params) => API.get('/tasks', { params }),
  getOne: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
  addComment: (id, data) => API.post(`/tasks/${id}/comments`, data),
  getBlocked: () => API.get('/tasks/blocked'),
  getDashboardStats: () => API.get('/tasks/stats/dashboard'),
};

// Incidents
export const incidentsAPI = {
  getAll: (params) => API.get('/incidents', { params }),
  getOne: (id) => API.get(`/incidents/${id}`),
  create: (data) => API.post('/incidents', data),
  update: (id, data) => API.put(`/incidents/${id}`, data),
  delete: (id) => API.delete(`/incidents/${id}`),
  addTimeline: (id, data) => API.post(`/incidents/${id}/timeline`, data),
};

// Notifications
export const notificationsAPI = {
  getAll: () => API.get('/notifications'),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put('/notifications/mark-all-read'),
  delete: (id) => API.delete(`/notifications/${id}`),
};

// Reviews
export const reviewsAPI = {
  getAll: () => API.get('/reviews'),
  update: (id, data) => API.put(`/reviews/${id}`, data),
  reassign: (id, data) => API.post(`/reviews/${id}/reassign`, data),
};

// Reports
export const reportsAPI = {
  get: (params) => API.get('/reports', { params }),
};

export default API;
