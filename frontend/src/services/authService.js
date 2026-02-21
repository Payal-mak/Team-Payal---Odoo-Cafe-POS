import api from './api';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.success) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        }
        return response.data;
    },

    // Synchronously wipes every trace of the session from the browser.
    // Call this BEFORE the async API hit so guards react instantly.
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('selectedTable');
        sessionStorage.clear();
        delete api.defaults.headers.common['Authorization'];
    },

    // Best-effort server-side token invalidation (fire-and-forget).
    logoutApi: async () => {
        await api.post('/auth/logout');
    },

    // Legacy alias — kept so any other caller still works.
    logout: async () => {
        authService.clearAuth();
        try {
            await authService.logoutApi();
        } catch {
            // ignore
        }
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    getStoredUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};

