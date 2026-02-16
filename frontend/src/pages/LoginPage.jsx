import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Coffee, Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const validateForm = () => {
        const newErrors = {};

        if (!isLogin && !formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                toast.success('Welcome back!');
                navigate('/dashboard');
            } else {
                // All signups are customers by default
                await register(formData.name, formData.email, formData.password, 'customer');
                toast.success('Account created successfully!');
                toast.info('You can now place orders at our cafe!');
                navigate('/dashboard');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message ||
                (isLogin ? 'Invalid credentials' : 'Registration failed');
            toast.error(errorMessage);

            if (error.response?.data?.errors) {
                const backendErrors = {};
                error.response.data.errors.forEach(err => {
                    backendErrors[err.path] = err.msg;
                });
                setErrors(backendErrors);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (role) => {
        const demoCredentials = {
            admin: { email: 'admin@cafe.com', password: 'admin123' },
            cashier: { email: 'cashier@cafe.com', password: 'cashier123' },
            kitchen: { email: 'kitchen@cafe.com', password: 'kitchen123' }
        };

        const creds = demoCredentials[role];

        setLoading(true);
        try {
            await login(creds.email, creds.password);
            toast.success(`Logged in as ${role}!`);
            navigate('/dashboard');
        } catch (error) {
            toast.error('Demo account not found. Please contact admin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <Coffee size={48} />
                    <h1>Odoo Cafe POS</h1>
                    <p>{isLogin ? 'Welcome back! Sign in to continue' : 'Create your customer account'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label>
                                <User size={18} />
                                Full Name
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.name ? 'error' : ''}`}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter your full name"
                                disabled={loading}
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>
                    )}

                    <div className="form-group">
                        <label>
                            <Mail size={18} />
                            Email Address
                        </label>
                        <input
                            type="email"
                            className={`form-control ${errors.email ? 'error' : ''}`}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label>
                            <Lock size={18} />
                            Password
                        </label>
                        <div className="password-input">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`form-control ${errors.password ? 'error' : ''}`}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                {isLogin ? 'Signing in...' : 'Creating account...'}
                            </>
                        ) : (
                            isLogin ? 'Sign In' : 'Sign Up'
                        )}
                    </button>
                </form>

                <div className="auth-toggle">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setErrors({});
                                setFormData({ name: '', email: '', password: '' });
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>

                {isLogin && (
                    <div className="demo-section">
                        <div className="divider">
                            <span>Demo Accounts (For Testing)</span>
                        </div>
                        <div className="demo-buttons">
                            <button
                                type="button"
                                className="btn btn-demo"
                                onClick={() => handleDemoLogin('admin')}
                                disabled={loading}
                            >
                                <User size={16} />
                                Admin Demo
                            </button>
                            <button
                                type="button"
                                className="btn btn-demo"
                                onClick={() => handleDemoLogin('cashier')}
                                disabled={loading}
                            >
                                <User size={16} />
                                Cashier Demo
                            </button>
                            <button
                                type="button"
                                className="btn btn-demo"
                                onClick={() => handleDemoLogin('kitchen')}
                                disabled={loading}
                            >
                                <User size={16} />
                                Kitchen Demo
                            </button>
                        </div>
                        <p className="demo-note">
                            Note: Staff accounts are created by admin only
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
