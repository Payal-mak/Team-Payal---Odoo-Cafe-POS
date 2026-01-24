import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token to requests
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

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle errors globally
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.data);

            // Handle 401 Unauthorized - token expired or invalid
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                // Optionally redirect to login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error:', error.message);
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Health API methods
export const healthAPI = {
    checkServer: () => api.get('/health'),
    checkDatabase: () => api.get('/health/db'),
    getTables: () => api.get('/health/tables'),
};

// Authentication API methods
export const authAPI = {
    signup: (username, email, password, role) =>
        api.post('/auth/signup', { username, email, password, role }),
    login: (email, password) =>
        api.post('/auth/login', { email, password }),
    verify: () =>
        api.get('/auth/verify'),
    getCurrentUser: () =>
        api.get('/auth/me'),
};

// Inventory API methods
export const inventoryAPI = {
    // Categories
    getCategories: () => api.get('/categories'),
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),

    // Products
    getProducts: () => api.get('/products'),
    getProduct: (id) => api.get(`/products/${id}`),
    createProduct: (data) => api.post('/products', data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Config API methods
export const configAPI = {
    // Floors
    getFloors: () => api.get('/floors'),
    createFloor: (data) => api.post('/floors', data),
    updateFloor: (id, data) => api.put(`/floors/${id}`, data),
    deleteFloor: (id) => api.delete(`/floors/${id}`),

    // Tables
    getTables: () => api.get('/tables'),
    getTablesByFloor: (floorId) => api.get(`/tables/by-floor/${floorId}`),
    createTable: (data) => api.post('/tables', data),
    updateTable: (id, data) => api.put(`/tables/${id}`, data),
    deleteTable: (id) => api.delete(`/tables/${id}`),
};

// Session API methods
export const sessionAPI = {
    active: (posConfigId) => api.get('/sessions/active', { params: { pos_config_id: posConfigId } }),
    open: (posConfigId) => api.post('/sessions/open', { pos_config_id: posConfigId }),
    get: (id) => api.get(`/sessions/${id}`),
};

// Order API methods
export const orderAPI = {
    create: (data) => api.post('/orders', data),
    get: (id) => api.get(`/orders/${id}`),
};

// Kitchen API methods
export const kitchenAPI = {
    getActive: () => api.get('/orders/kitchen/active'),
    updateStage: (id, stage) => api.put(`/orders/${id}/kitchen-stage`, { stage }),
};

export default api;
