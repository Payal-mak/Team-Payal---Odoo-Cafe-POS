import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Coffee, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import './SignupPage.css';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const SignupPage = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated, loading: authLoading } = useAuth();

    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [touched, setTouched] = useState({ name: false, email: false, password: false });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate]);

    const errors = {
        name: form.name.trim().length === 0 ? 'Name is required' : '',
        email: !validateEmail(form.email) ? 'Please enter a valid email address' : '',
        password: form.password.length < 6 ? 'Password must be at least 6 characters' : '',
    };

    const isValid = !errors.name && !errors.email && !errors.password;

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrorMsg('');
    };

    const handleBlur = (field) => () =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ name: true, email: true, password: true });
        if (!isValid) return;

        setLoading(true);
        setErrorMsg('');

        try {
            await register(form.name.trim(), form.email, form.password);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            setErrorMsg(
                error.response?.data?.message || 'Sign up failed. Please try again.'
            );
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

                <h2 className="auth-heading">Create account</h2>
                <p className="auth-subheading">Join us and start managing your cafe</p>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {/* Inline error banner */}
                    {errorMsg && (
                        <div className="form-error-banner" role="alert">
                            <XCircle size={16} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Name */}
                    <div className="form-group">
                        <label htmlFor="signup-name">Full Name</label>
                        <div className="input-wrapper">
                            <input
                                id="signup-name"
                                type="text"
                                className={getFieldClass('name')}
                                placeholder="Your full name"
                                value={form.name}
                                onChange={handleChange('name')}
                                onBlur={handleBlur('name')}
                                disabled={loading}
                                autoComplete="name"
                            />
                            {touched.name && (
                                <span className="input-icon-right">
                                    {errors.name
                                        ? <XCircle size={16} className="icon-error" />
                                        : <CheckCircle2 size={16} className="icon-success" />}
                                </span>
                            )}
                        </div>
                        {touched.name && errors.name && (
                            <p className="field-error">{errors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="signup-email">Email Address</label>
                        <div className="input-wrapper">
                            <input
                                id="signup-email"
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
                        <label htmlFor="signup-password">Password</label>
                        <div className="input-wrapper">
                            <input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                className={getFieldClass('password')}
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={handleChange('password')}
                                onBlur={handleBlur('password')}
                                disabled={loading}
                                autoComplete="new-password"
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
                        {/* Strength hint */}
                        {form.password.length > 0 && (
                            <div className="password-strength">
                                {[1, 2, 3, 4].map((i) => (
                                    <span
                                        key={i}
                                        className={`strength-bar ${form.password.length >= i * 3 ? 'active' : ''
                                            }`}
                                    />
                                ))}
                                <span className="strength-label">
                                    {form.password.length < 4
                                        ? 'Too short'
                                        : form.password.length < 7
                                            ? 'Weak'
                                            : form.password.length < 10
                                                ? 'Good'
                                                : 'Strong'}
                                </span>
                            </div>
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
                                Creating account…
                            </>
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
