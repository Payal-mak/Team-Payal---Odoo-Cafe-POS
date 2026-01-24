import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posTerminalAPI, posSessionAPI } from '../../services/api';
import CreateTerminalModal from '../../components/CreateTerminalModal';
import TerminalConfigModal from '../../components/TerminalConfigModal';
import logo from '../../assets/logo.jpeg';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [terminals, setTerminals] = useState([]);
    const [sessions, setSessions] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedTerminal, setSelectedTerminal] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            // Redirect kitchen users to their display
            if (parsedUser.role === 'kitchen_user') {
                navigate('/kitchen');
                return;
            }
            setUser(parsedUser);
            fetchTerminals();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchTerminals = async () => {
        try {
            const response = await posTerminalAPI.getAll();
            if (response.data.success) {
                const terminalList = response.data.terminals;
                setTerminals(terminalList);

                // Fetch current session for each terminal
                const sessionPromises = terminalList.map(async (terminal) => {
                    try {
                        const sessionResponse = await posSessionAPI.getCurrent(terminal.id);
                        return { terminalId: terminal.id, session: sessionResponse.data.session };
                    } catch (err) {
                        return { terminalId: terminal.id, session: null };
                    }
                });

                const sessionResults = await Promise.all(sessionPromises);
                const sessionsMap = {};
                sessionResults.forEach(({ terminalId, session }) => {
                    sessionsMap[terminalId] = session;
                });
                setSessions(sessionsMap);
            }
        } catch (err) {
            console.error('Failed to fetch terminals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTerminal = async (name) => {
        try {
            setError('');
            setSuccess('');
            const response = await posTerminalAPI.create({ name });
            if (response.data.success) {
                setSuccess('POS Terminal created successfully!');
                fetchTerminals();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            throw err; // Let modal handle the error
        }
    };

    const handleUpdateConfig = async (id, config) => {
        try {
            setError('');
            setSuccess('');
            const response = await posTerminalAPI.updateConfig(id, config);
            if (response.data.success) {
                setSuccess('Terminal configuration updated successfully!');
                fetchTerminals();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            throw err; // Let modal handle the error
        }
    };

    const handleOpenSession = async (terminalId) => {
        try {
            setError('');
            setSuccess('');
            const response = await posSessionAPI.open({ terminalId });
            if (response.data.success) {
                setSuccess('Session opened successfully!');
                fetchTerminals();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to open session');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleCloseSession = async (sessionId, terminalName) => {
        if (!confirm(`Are you sure you want to close the session for "${terminalName}"?`)) {
            return;
        }

        try {
            setError('');
            setSuccess('');
            const response = await posSessionAPI.close({ sessionId });
            if (response.data.success) {
                setSuccess('Session closed successfully!');
                fetchTerminals();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to close session');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleDeleteTerminal = async (id, name) => {
        // Check if terminal has an open session
        if (sessions[id]) {
            setError('Cannot delete terminal with an open session. Please close the session first.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        if (!confirm(`Are you sure you want to delete terminal "${name}"?`)) {
            return;
        }

        try {
            setError('');
            const response = await posTerminalAPI.delete(id);
            if (response.data.success) {
                setSuccess('Terminal deleted successfully!');
                fetchTerminals();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete terminal');
        }
    };

    const openConfigModal = (terminal) => {
        setSelectedTerminal(terminal);
        setShowConfigModal(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen p-8 animate-fade-in">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="card mb-8 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img
                            src={logo}
                            alt="Odoo Cafe"
                            className="w-16 h-16 rounded-full shadow-lg ring-2 ring-white/50"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-gradient">
                                Odoo Cafe POS Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Welcome back, <span className="font-semibold text-cafe-brown">{user.username}</span>!
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {user.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin/users')}
                                className="btn-secondary"
                            >
                                Manage Users
                            </button>
                        )}
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
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg animate-fade-in">
                        <p className="font-medium">{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg animate-fade-in">
                        <p className="font-medium">{success}</p>
                    </div>
                )}

                {/* POS Terminals Section */}
                <div className="card mb-8 animate-slide-up">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-cafe-brown">
                            POS Terminals
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New POS
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cafe-brown"></div>
                            <p className="mt-4 text-gray-600">Loading terminals...</p>
                        </div>
                    ) : terminals.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No POS Terminals Yet</h3>
                            <p className="text-gray-600 mb-4">Create your first POS terminal to get started</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary"
                            >
                                Create Terminal
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {terminals.map((terminal) => {
                                const currentSession = sessions[terminal.id];
                                const hasOpenSession = currentSession !== null && currentSession !== undefined;

                                return (
                                    <div
                                        key={terminal.id}
                                        className={`bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${hasOpenSession ? 'border-green-500' : 'border-primary-100 hover:border-cafe-brown'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-bold text-cafe-brown">
                                                        {terminal.name}
                                                    </h3>
                                                    {hasOpenSession && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                                            OPEN
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Created by {terminal.created_by_name || 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => openConfigModal(terminal)}
                                                    className="text-gray-500 hover:text-cafe-brown transition-colors"
                                                    title="Configure Payment Methods"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTerminal(terminal.id, terminal.name)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                    title="Delete terminal"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Payment Types Indicators */}
                                        <div className="flex gap-2 mb-4">
                                            {terminal.cash_enabled !== 0 && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200" title="Cash Enabled">
                                                    Cash
                                                </span>
                                            )}
                                            {terminal.digital_enabled !== 0 && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200" title="Digital Enabled">
                                                    Card
                                                </span>
                                            )}
                                            {terminal.upi_enabled !== 0 && (
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200" title={`UPI: ${terminal.upi_id || 'Not Set'}`}>
                                                    UPI
                                                </span>
                                            )}
                                        </div>

                                        {/* Session Info */}
                                        <div className="mb-4 text-sm space-y-1">
                                            {hasOpenSession ? (
                                                <>
                                                    <p className="text-gray-700">
                                                        <span className="font-semibold">Session opened:</span>{' '}
                                                        {new Date(currentSession.open_date).toLocaleString()}
                                                    </p>
                                                    <p className="text-gray-700">
                                                        <span className="font-semibold">Opened by:</span>{' '}
                                                        {currentSession.opened_by_name}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-gray-600">
                                                        <span className="font-semibold">Last session:</span>{' '}
                                                        {terminal.last_open_session_id ? `#${terminal.last_open_session_id}` : 'None'}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <span className="font-semibold">Last closing amount:</span>{' '}
                                                        ${terminal.last_closing_sale_amount || '0.00'}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        {hasOpenSession ? (
                                            <button
                                                onClick={() => handleCloseSession(currentSession.id, terminal.name)}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                                            >
                                                Close Session
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleOpenSession(terminal.id)}
                                                className="w-full btn-primary"
                                            >
                                                Open Session
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* User Info Card */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-2xl font-bold text-cafe-brown mb-6">
                        Account Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border-2 border-primary-100">
                            <p className="text-sm font-semibold text-gray-600 mb-1">Username</p>
                            <p className="text-lg font-bold text-cafe-brown">{user.username}</p>
                        </div>
                        <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border-2 border-primary-100">
                            <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                            <p className="text-lg font-bold text-cafe-brown">{user.email}</p>
                        </div>
                        <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border-2 border-primary-100">
                            <p className="text-sm font-semibold text-gray-600 mb-1">Role</p>
                            <p className="text-lg font-bold text-cafe-brown capitalize">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'kitchen_user' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                    }`}>
                                    {user.role.replace('_', ' ')}
                                </span>
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-xl border-2 border-primary-100">
                            <p className="text-sm font-semibold text-gray-600 mb-1">User ID</p>
                            <p className="text-lg font-bold text-cafe-brown">#{user.id}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Terminal Modal */}
            <CreateTerminalModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateTerminal}
            />

            {/* Configure Terminal Modal */}
            <TerminalConfigModal
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                terminal={selectedTerminal}
                onUpdate={handleUpdateConfig}
            />
        </div>
    );
}
