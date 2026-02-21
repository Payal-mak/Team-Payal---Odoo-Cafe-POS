import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);

    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const [signupData, setSignupData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(loginData.email, loginData.password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await register(signupData.name, signupData.email, signupData.password, 'customer');
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h1 className="auth-title">Login & SignUp Page</h1>

                <div className="auth-panels">
                    {/* Login Panel */}
                    <div className="auth-panel">
                        <h2 className="panel-title">Login</h2>

                        <form onSubmit={handleLogin} className="auth-form">
                            <div className="form-group">
                                <label>Email/Username</label>
                                <input
                                    type="email"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-input">
                                    <input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    >
                                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Login'}
                            </button>

                            <div className="panel-link">
                                <a href="#signup" onClick={(e) => { e.preventDefault(); document.querySelector('.auth-panels').scrollLeft = 500; }}>
                                    Sign Up here
                                </a>
                            </div>
                        </form>
                    </div>

                    {/* SignUp Panel */}
                    <div className="auth-panel">
                        <h2 className="panel-title">SignUp</h2>

                        <form onSubmit={handleSignup} className="auth-form">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={signupData.name}
                                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email/Username</label>
                                <input
                                    type="email"
                                    value={signupData.email}
                                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-input">
                                    <input
                                        type={showSignupPassword ? 'text' : 'password'}
                                        value={signupData.password}
                                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                                    >
                                        {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : 'Sign Up'}
                            </button>

                            <div className="panel-link">
                                <a href="#login" onClick={(e) => { e.preventDefault(); document.querySelector('.auth-panels').scrollLeft = 0; }}>
                                    Login
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
