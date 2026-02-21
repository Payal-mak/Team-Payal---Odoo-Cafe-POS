import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = authService.getStoredUser();
        if (storedUser && authService.getToken()) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        setUser(data.data.user);
        return data;
    };

    const register = async (name, email, password, role = 'customer') => {
        const userData = { name, email, password, role };
        const data = await authService.register(userData);
        setUser(data.data.user);
        return data;
    };

    // Clears user state FIRST (synchronously triggers re-render of all
    // ProtectedRoute guards), then cleans up storage & calls the API.
    const logout = useCallback(async () => {
        // 1. Clear React state immediately — ProtectedRoute will redirect
        setUser(null);
        // 2. Clear all persistent storage so refreshes also land on /login
        authService.clearAuth();
        // 3. Try to invalidate the token server-side (best-effort)
        try {
            await authService.logoutApi();
        } catch {
            // Ignore — storage is already cleared
        }
    }, []);

    const value = {
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
