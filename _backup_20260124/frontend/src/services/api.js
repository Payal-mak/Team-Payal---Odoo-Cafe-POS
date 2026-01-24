import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getCurrentUser: () => api.get('/auth/me'),
    getAllUsers: () => api.get('/auth/users'),
    updateUserRole: (userId, role) => api.patch(`/auth/users/${userId}/role`, { role }),
};

// POS Terminal API
export const posTerminalAPI = {
    create: (data) => api.post('/pos-terminals', data),
    getAll: () => api.get('/pos-terminals'),
    getOne: (id) => api.get(`/pos-terminals/${id}`),
    delete: (id) => api.delete(`/pos-terminals/${id}`),
    updateConfig: (id, data) => api.patch(`/pos-terminals/${id}/config`, data),
};

// POS Session API
export const posSessionAPI = {
    open: (data) => api.post('/pos-sessions/open', data),
    close: (data) => api.post('/pos-sessions/close', data),
    getCurrent: (terminalId) => api.get(`/pos-sessions/current/${terminalId}`),
    getTerminalSessions: (terminalId) => api.get(`/pos-sessions/terminal/${terminalId}`),
};

export default api;
