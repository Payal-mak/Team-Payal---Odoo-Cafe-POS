import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Coffee, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import './LoginPage.css';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading: authLoading, user } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [touched, setTouched] = useState({ email: false, password: false });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            const redirectPath = user.role === 'kitchen_staff' ? '/kitchen' : '/dashboard';
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate, user]);

    const errors = {
        email: !validateEmail(form.email) ? 'Please enter a valid email address' : '',
        password: form.password.length < 6 ? 'Password must be at least 6 characters' : '',
    };

    const isValid = !errors.email && !errors.password;

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrorMsg('');
    };

    const handleBlur = (field) => () =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        if (!isValid) return;

        setLoading(true);
        setErrorMsg('');

        try {
            const res = await login(form.email, form.password);
            const loggedInUser = res.data?.user || res.data;
            const redirectPath = loggedInUser?.role === 'kitchen_staff' ? '/kitchen' : '/dashboard';
            navigate(redirectPath, { replace: true });
        } catch (error) {
            setErrorMsg(
                error.response?.data?.message || 'Invalid email or password. Please try again.'
            );
            setForm((prev) => ({ ...prev, password: '' }));
        } finally {
            setLoading(false);
        }
    };



    const getFieldClass = (field) => {
        if (!touched[field]) return 'input-field';
        if (errors[field]) return 'input-field input-error';
        return 'input-field input-success';
    };

    if (authLoading) {
        return (
            <div className="auth-page">
                <div className="auth-loading">
                    <Loader2 className="spin" size={36} />
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-bg-overlay" />

            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="logo-icon">
                        <Coffee size={28} />
                    </div>
                    <h1 className="logo-text">Odoo Cafe POS</h1>
                </div>

                <h2 className="auth-heading">Welcome back</h2>
                <p className="auth-subheading">Sign in to your account to continue</p>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {/* Inline error banner */}
                    {errorMsg && (
                        <div className="form-error-banner" role="alert">
                            <XCircle size={16} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <div className="input-wrapper">
                            <input
                                id="login-email"
                                type="email"
                                className={getFieldClass('email')}
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange('email')}
                                onBlur={handleBlur('email')}
                                disabled={loading}
                                autoComplete="email"
                            />
                            {touched.email && (
                                <span className="input-icon-right">
                                    {errors.email
                                        ? <XCircle size={16} className="icon-error" />
                                        : <CheckCircle2 size={16} className="icon-success" />}
                                </span>
                            )}
                        </div>
                        {touched.email && errors.email && (
                            <p className="field-error">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <div className="input-wrapper">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className={getFieldClass('password')}
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={handleChange('password')}
                                onBlur={handleBlur('password')}
                                disabled={loading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={-1}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {touched.password && errors.password && (
                            <p className="field-error">{errors.password}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn-primary-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spin" />
                                Signing in…
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <p className="auth-switch">
                    Don&apos;t have an account?{' '}
                    <Link to="/signup" className="auth-link">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
