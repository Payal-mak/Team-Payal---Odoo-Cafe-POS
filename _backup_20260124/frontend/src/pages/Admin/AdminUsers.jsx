import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import logo from '../../assets/logo.jpeg';

export default function AdminUsers() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'admin') {
                navigate('/dashboard');
                return;
            }
            setUser(parsedUser);
            fetchUsers();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            const response = await authAPI.getAllUsers();
            if (response.data.success) {
                setUsers(response.data.users);
            }
        } catch (err) {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setError('');
            setSuccess('');
            const response = await authAPI.updateUserRole(userId, newRole);
            if (response.data.success) {
                setSuccess('Role updated successfully. User must login again for changes to take effect.');
                fetchUsers();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user || loading) return null;

    return (
        <div className="min-h-screen p-8 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="card mb-8 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img
                            src={logo}
                            alt="Odoo Cafe"
                            className="w-16 h-16 rounded-full shadow-lg ring-2 ring-white/50"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-gradient">
                                User Management
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage user roles and permissions
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-secondary"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn-primary"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        <p className="font-medium">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg">
                        <p className="font-medium">{success}</p>
                    </div>
                )}

                {/* Users Table */}
                <div className="card">
                    <h2 className="text-2xl font-bold text-cafe-brown mb-6">
                        All Users
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Role</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Change Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">#{u.id}</td>
                                        <td className="py-3 px-4 font-medium">{u.username}</td>
                                        <td className="py-3 px-4 text-gray-600">{u.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    u.role === 'kitchen_user' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                }`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={u.id === user.id}
                                                className="input-field py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="pos_user">POS User</option>
                                                <option value="kitchen_user">Kitchen User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
