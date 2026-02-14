import { useState } from 'react';
import './Auth.css';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'pos_user'
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin && !formData.username.trim()) {
      newErrors.username = 'Username is required';
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

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    setAlert(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setAlert({
          type: 'success',
          message: isLogin ? 'Login successful! Redirecting...' : 'Account created successfully!'
        });

        // Call onLogin callback
        setTimeout(() => {
          onLogin(data.user);
        }, 1000);
      } else {
        setAlert({
          type: 'error',
          message: data.message || 'Something went wrong. Please try again.'
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAlert({
        type: 'error',
        message: 'Unable to connect to server. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (loginMode) => {
    setIsLogin(loginMode);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'pos_user'
    });
    setErrors({});
    setAlert(null);
  };

  return (
    <div className="auth-container">
      {/* Left Side - Branding */}
      <div className="auth-left">
        <div className="auth-branding">
          <img src="/logo.png" alt="Odoo Cafe Logo" className="auth-logo" />
          <h1 className="auth-title">Odoo Cafe POS</h1>
          <p className="auth-subtitle">
            Complete Point of Sale solution for modern cafes and restaurants
          </p>

          <div className="auth-features">
            <div className="feature-item">
              <span className="feature-icon">🍕</span>
              <span className="feature-text">Streamlined Order Management</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-text">Real-time Analytics & Reports</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔔</span>
              <span className="feature-text">Kitchen Display System</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💳</span>
              <span className="feature-text">Multiple Payment Options</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="auth-form-description">
              {isLogin
                ? 'Sign in to access your POS dashboard'
                : 'Get started with Odoo Cafe POS'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => switchTab(true)}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => switchTab(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Alert Messages */}
          {alert && (
            <div className={`alert alert-${alert.type}`}>
              <span>{alert.type === 'success' ? '✓' : '⚠'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && (
                  <span className="error-message">{errors.username}</span>
                )}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            {!isLogin && (
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>
            )}

            {!isLogin && (
              <div className="input-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="pos_user">POS User</option>
                  <option value="kitchen_user">Kitchen User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {isLogin && (
              <div className="forgot-password">
                <a href="#forgot">Forgot Password?</a>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-login">
            <button className="social-btn">
              <span className="social-icon">G</span>
              <span>Google</span>
            </button>
            <button className="social-btn">
              <span className="social-icon">f</span>
              <span>Facebook</span>
            </button>
          </div>

          <div className="auth-footer">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <a href="#signup" onClick={(e) => { e.preventDefault(); switchTab(false); }}>
                  Sign up
                </a>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <a href="#login" onClick={(e) => { e.preventDefault(); switchTab(true); }}>
                  Sign in
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
