import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'pos_user'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (user) {
        if (user.role === 'pos_user') navigate('/pos');
        else if (user.role === 'kitchen_user') navigate('/kitchen');
        else if (user.role === 'admin') navigate('/admin');
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        const result = await signup(
            formData.username,
            formData.email,
            formData.password,
            formData.role
        );

        if (result.success) {
            // Redirect based on role
            if (result.user.role === 'pos_user') {
                navigate('/pos');
            } else if (result.user.role === 'kitchen_user') {
                navigate('/kitchen');
            } else if (result.user.role === 'admin') {
                navigate('/admin');
            }
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-coffee-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">☕</div>
                    <h1 className="text-4xl font-display font-bold text-espresso-900 mb-2">
                        Odoo Cafe POS
                    </h1>
                    <p className="text-espresso-600">Create your account to get started.</p>
                </div>

                {/* Signup Card */}
                <div className="card">
                    <h2 className="text-2xl font-semibold text-espresso-900 mb-6">Sign Up</h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-espresso-800 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Choose a username"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-espresso-800 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-espresso-800 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Create a password (min. 6 characters)"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-espresso-800 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Confirm your password"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-espresso-800 mb-2">
                                Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="input-field"
                                required
                                disabled={loading}
                            >
                                <option value="pos_user">POS User</option>
                                <option value="kitchen_user">Kitchen User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <p className="text-xs text-espresso-600 mt-1">
                                Select your role in the system
                            </p>
                        </div>

                        {/* Signup Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Sign Up'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-espresso-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-coffee-600 hover:text-coffee-700 font-medium">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-espresso-500">
                    <p>© 2026 Odoo Cafe POS. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
