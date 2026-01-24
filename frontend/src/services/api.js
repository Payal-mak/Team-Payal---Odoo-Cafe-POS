import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
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

export const authAPI = {
    signup: (userData) => api.post('/auth/signup', userData),
    login: (credentials) => api.post('/auth/login', credentials),
};

// ============ PRODUCTS ============
export const productAPI = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    create: (productData) => api.post('/products', productData),
    update: (id, productData) => api.put(`/products/${id}`, productData),
    delete: (id) => api.delete(`/products/${id}`)
};

// ============ CATEGORIES ============
export const categoryAPI = {
    getAll: () => api.get('/categories'),
    create: (categoryData) => api.post('/categories', categoryData),
    update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
    delete: (id) => api.delete(`/categories/${id}`)
};

// ============ FLOORS ============
export const floorAPI = {
    getAll: () => api.get('/floors'),
    getById: (id) => api.get(`/floors/${id}`),
    create: (floorData) => api.post('/floors', floorData),
    update: (id, floorData) => api.put(`/floors/${id}`, floorData),
    delete: (id) => api.delete(`/floors/${id}`)
};

// ============ TABLES ============
export const tableAPI = {
    getAll: () => api.get('/tables'),
    getByFloor: (floorId) => api.get(`/tables/floor/${floorId}`),
    getById: (id) => api.get(`/tables/${id}`),
    create: (tableData) => api.post('/tables', tableData),
    update: (id, tableData) => api.put(`/tables/${id}`, tableData),
    delete: (id) => api.delete(`/tables/${id}`)
};

// ============ DASHBOARD ============
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getRecentActivity: (limit = 10) => api.get(`/dashboard/recent-activity?limit=${limit}`)
};

// ============ SESSIONS ============
export const sessionAPI = {
    getPosConfigs: () => api.get('/pos-configs'),
    getCurrent: (userId) => api.get(`/sessions/current?user_id=${userId}`),
    getHistory: (userId, limit = 20) => api.get(`/sessions/history?user_id=${userId}&limit=${limit}`),
    getById: (id) => api.get(`/sessions/${id}`),
    open: (data) => api.post('/sessions/open', data),
    close: (id, data) => api.post(`/sessions/${id}/close`, data)
};

export default api;
