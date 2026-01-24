import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionAPI } from '../services/api';

const POSDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkActiveSession();
    }, []);

    const checkActiveSession = async () => {
        try {
            // Default config ID 1 for MVP
            const response = await sessionAPI.active(1);
            setActiveSession(response.data.data.session);
        } catch (err) {
            console.error('Failed to check session', err);
            // Don't block UI on error, just show "New Session"
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async () => {
        setLoading(true);
        try {
            if (activeSession) {
                // Resume
                navigate('/pos/floors');
            } else {
                // Open New
                await sessionAPI.open(1);
                navigate('/pos/floors');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to open session');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 to-coffee-100 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-coffee-600 rounded-full flex items-center justify-center text-white text-xl">
                        ☕
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-xl text-espresso-900">Odoo Cafe POS</h1>
                        <p className="text-xs text-espresso-500">Point of Sale Terminal</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-espresso-900">{user?.username}</p>
                        <p className="text-xs text-espresso-500">Cashier</p>
                    </div>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-espresso-800 text-sm">
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="bg-coffee-600 h-24 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-black bg-opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.1 }}></div>
                        <h2 className="text-white text-2xl font-bold font-display z-10">
                            {activeSession ? 'Session Active' : 'New Session'}
                        </h2>
                    </div>

                    <div className="p-8 text-center">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="mb-8">
                            <div className="w-20 h-20 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
                                {activeSession ? '🔓' : '🔐'}
                            </div>
                            <p className="text-espresso-600">
                                {activeSession
                                    ? `Session started at ${new Date(activeSession.open_date).toLocaleTimeString()}`
                                    : 'Ready to start a new selling session?'}
                            </p>
                        </div>

                        <button
                            onClick={handleStartSession}
                            className="w-full btn-primary py-4 text-lg shadow-lg transform transition-transform hover:scale-[1.02]"
                        >
                            {activeSession ? 'Resume Session' : 'Open Session'}
                        </button>

                        {!activeSession && (
                            <p className="mt-4 text-xs text-gray-400">
                                Opening balance will be set to 0.00
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default POSDashboard;
