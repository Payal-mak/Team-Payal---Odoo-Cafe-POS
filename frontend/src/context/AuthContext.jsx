import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialise from localStorage on first mount
    useEffect(() => {
        const storedUser = authService.getStoredUser();
        if (storedUser && authService.getToken()) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    // Listen for 401 events fired by the api.js interceptor.
    // This clears React state WITHOUT a full page reload, letting
    // React Router's ProtectedRoute redirect cleanly to /login.
    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            authService.clearAuth();
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
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

    // IMPORTANT: call logoutApi() FIRST (token still exists) so the backend
    // gets a valid authenticated request. THEN clear state and storage.
    // Previously clearAuth() ran first → token gone → backend returned 401
    // → interceptor fired window.location.href → full page reload bug.
    const logout = useCallback(async () => {
        try {
            await authService.logoutApi(); // send with token still intact
        } catch {
            // ignore server errors — still log out locally
        }
        setUser(null);
        authService.clearAuth();
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

