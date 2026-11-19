import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiry (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthUrl = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthUrl) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data)
};

export const categoryApi = {
  getCategories: () => api.get('/categories')
};

export const departmentApi = {
  getDepartments: () => api.get('/departments'),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.patch(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`)
};

export const userApi = {
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.patch(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

export const grievanceApi = {
  fileGrievance: (formData) => api.post('/grievances', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getGrievances: (params) => api.get('/grievances', { params }),
  getGrievanceById: (id) => api.get(`/grievances/${id}`),
  trackByTrackingId: (trackingId) => api.get(`/grievances/track/${trackingId}`),
  updateStatus: (id, data) => api.patch(`/grievances/${id}/status`, data),
  assignGrievance: (id, data) => api.patch(`/grievances/${id}/assign`, data),
  addComment: (id, data) => api.post(`/grievances/${id}/comments`, data),
  addFeedback: (id, data) => api.post(`/grievances/${id}/feedback`, data),
  reopenGrievance: (id, data) => api.post(`/grievances/${id}/reopen`, data),
  getAttachmentBlob: (id, index) => api.get(`/grievances/${id}/attachments/${index}`, {
    responseType: 'blob'
  })
};

export const notificationApi = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all')
};

export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
  getByCategory: () => api.get('/analytics/by-category'),
  getResolutionTime: () => api.get('/analytics/resolution-time')
};

export const auditLogApi = {
  getAuditLogs: (params) => api.get('/audit-logs', { params })
};

export const jobApi = {
  triggerEscalation: (cronSecret = null) => {
    const headers = {};
    if (cronSecret) headers['x-cron-secret'] = cronSecret;
    return api.post('/jobs/escalate', {}, { headers });
  }
};

export default api;
