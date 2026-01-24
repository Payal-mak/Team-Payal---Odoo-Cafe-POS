import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.jpeg';

export default function KitchenDisplay() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            // Kitchen users only
            if (parsedUser.role !== 'kitchen_user' && parsedUser.role !== 'admin') {
                navigate('/dashboard');
                return;
            }
            setUser(parsedUser);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 animate-fade-in">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="glass-effect bg-gray-800/80 rounded-2xl p-6 flex items-center justify-between border border-gray-700">
                    <div className="flex items-center space-x-4">
                        <img
                            src={logo}
                            alt="Odoo Cafe"
                            className="w-14 h-14 rounded-full shadow-lg ring-2 ring-orange-500/50"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Kitchen Display System
                            </h1>
                            <p className="text-gray-300 mt-1">
                                Welcome, <span className="font-semibold text-orange-400">{user.username}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 shadow-lg"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Kitchen Content */}
            <div className="max-w-7xl mx-auto">
                <div className="glass-effect bg-gray-800/80 rounded-2xl p-8 border border-gray-700">
                    <div className="text-center py-12">
                        <div className="mb-6">
                            <svg className="w-24 h-24 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Kitchen Display Coming Soon
                        </h2>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                            The Kitchen Display System will show incoming orders with stages:
                            <span className="block mt-4 font-semibold text-orange-400">
                                To Cook → Preparing → Completed
                            </span>
                        </p>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                            <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4">
                                <h3 className="font-bold text-yellow-400 text-lg mb-2">To Cook</h3>
                                <p className="text-gray-300 text-sm">New orders waiting</p>
                            </div>
                            <div className="bg-blue-500/20 border-2 border-blue-500 rounded-lg p-4">
                                <h3 className="font-bold text-blue-400 text-lg mb-2">Preparing</h3>
                                <p className="text-gray-300 text-sm">Currently cooking</p>
                            </div>
                            <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-4">
                                <h3 className="font-bold text-green-400 text-lg mb-2">Completed</h3>
                                <p className="text-gray-300 text-sm">Ready to serve</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
