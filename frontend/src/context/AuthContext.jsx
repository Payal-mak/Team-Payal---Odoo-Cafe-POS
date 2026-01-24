import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (token) {
                try {
                    const response = await authAPI.verify();
                    setUser(response.data.data.user);
                } catch (error) {
                    console.error('Token verification failed:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        verifyToken();
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            const { user, token } = response.data.data;

            setUser(user);
            setToken(token);
            localStorage.setItem('token', token);

            return { success: true, user };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return { success: false, error: message };
        }
    };

    const signup = async (username, email, password, role) => {
        try {
            const response = await authAPI.signup(username, email, password, role);
            const { user, token } = response.data.data;

            setUser(user);
            setToken(token);
            localStorage.setItem('token', token);

            return { success: true, user };
        } catch (error) {
            const message = error.response?.data?.message || 'Signup failed';
            return { success: false, error: message };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const value = {
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
