import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, sessionAPI } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [currentSession, setCurrentSession] = useState(null);
    const [posConfigs, setPosConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
    const [sessionFormData, setSessionFormData] = useState({
        pos_config_id: '',
        opening_balance: ''
    });
    const [closingBalance, setClosingBalance] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, sessionRes, configsRes] = await Promise.all([
                dashboardAPI.getStats(),
                user?.id ? sessionAPI.getCurrent(user.id) : Promise.resolve({ data: { data: null } }),
                sessionAPI.getPosConfigs()
            ]);

            setStats(statsRes.data.data);
            setCurrentSession(sessionRes.data.data);
            setPosConfigs(configsRes.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    const handleOpenSession = async (e) => {
        e.preventDefault();
        try {
            await sessionAPI.open({
                ...sessionFormData,
                user_id: user.id
            });
            fetchDashboardData();
            setIsSessionModalOpen(false);
            setSessionFormData({ pos_config_id: '', opening_balance: '' });
        } catch (error) {
            console.error('Error opening session:', error);
            alert(error.response?.data?.message || 'Failed to open session');
        }
    };

    const handleCloseSession = async () => {
        if (!currentSession) return;
        try {
            await sessionAPI.close(currentSession.id, {
                closing_balance: parseFloat(closingBalance) || 0
            });
            fetchDashboardData();
            setIsCloseSessionModalOpen(false);
            setClosingBalance('');
        } catch (error) {
            console.error('Error closing session:', error);
            alert(error.response?.data?.message || 'Failed to close session');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatCurrency = (amount) => {
        return `$${(parseFloat(amount) || 0).toFixed(2)}`;
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-state">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>🍽️ Odoo Cafe POS</h1>
                    <p className="header-subtitle">Restaurant Management System</p>
                </div>
                <div className="header-actions">
                    <ThemeToggle />
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                {/* Welcome Section */}
                <div className="welcome-section">
                    <div className="welcome-card">
                        <h2>Welcome back, {user?.username}! 👋</h2>
                        <p className="welcome-subtitle">
                            Role: <span className="role-badge">{user?.role}</span>
                        </p>
                    </div>
                    {currentSession ? (
                        <div className="session-card active-session">
                            <div className="session-icon">🟢</div>
                            <div className="session-info">
                                <h3>Active Session</h3>
                                <p className="session-pos-name">{currentSession.pos_name}</p>
                                <p className="session-time">
                                    Started: {formatDateTime(currentSession.open_date)}
                                </p>
                                <p className="session-sales">
                                    Sales: {formatCurrency(currentSession.total_sales || 0)}
                                </p>
                                <button
                                    className="btn-danger"
                                    onClick={() => setIsCloseSessionModalOpen(true)}
                                >
                                    Close Session
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="session-card">
                            <div className="session-icon">⏸️</div>
                            <div className="session-info">
                                <h3>No Active Session</h3>
                                <p>Open a session to start taking orders</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => setIsSessionModalOpen(true)}
                                >
                                    Open Session
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-content">
                            <h3>{stats?.products.total || 0}</h3>
                            <p>Total Products</p>
                            <span className="stat-detail">{stats?.products.categories || 0} categories</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🏢</div>
                        <div className="stat-content">
                            <h3>{stats?.floors.total || 0}</h3>
                            <p>Total Floors</p>
                            <span className="stat-detail">{stats?.floors.tables || 0} tables configured</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🪑</div>
                        <div className="stat-content">
                            <h3>{stats?.floors.activeTables || 0}</h3>
                            <p>Active Tables</p>
                            <span className="stat-detail">Ready for service</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🛒</div>
                        <div className="stat-content">
                            <h3>{stats?.orders.today || 0}</h3>
                            <p>Today's Orders</p>
                            <span className="stat-detail">{stats?.orders.total || 0} total orders</span>
                        </div>
                    </div>

                    <div className="stat-card highlight">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <h3>{formatCurrency(stats?.revenue.today)}</h3>
                            <p>Today's Revenue</p>
                            <span className="stat-detail">From completed orders</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-section">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="action-grid">
                        <div
                            className="action-card"
                            onClick={() => navigate('/products')}
                        >
                            <div className="action-icon">📦</div>
                            <h3>Manage Products</h3>
                            <p>Add, edit, or remove menu items</p>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate('/floors-tables')}
                        >
                            <div className="action-icon">🏢</div>
                            <h3>Manage Tables</h3>
                            <p>Configure floors and table layouts</p>
                        </div>

                        <div
                            className={`action-card ${!currentSession ? 'disabled' : ''}`}
                            onClick={() => currentSession && navigate('/pos')}
                        >
                            <div className="action-icon">🍽️</div>
                            <h3>New Order</h3>
                            <p>Create a new table order</p>
                            {!currentSession && <span className="coming-soon">Requires Session</span>}
                        </div>

                        <div className="action-card disabled">
                            <div className="action-icon">📊</div>
                            <h3>View Reports</h3>
                            <p>Sales and analytics dashboards</p>
                            <span className="coming-soon">Coming Soon</span>
                        </div>

                        <div className="action-card disabled">
                            <div className="action-icon">🖥️</div>
                            <h3>Kitchen Display</h3>
                            <p>View and manage kitchen orders</p>
                            <span className="coming-soon">Coming Soon</span>
                        </div>

                        <div className="action-card disabled">
                            <div className="action-icon">⚙️</div>
                            <h3>Settings</h3>
                            <p>Configure POS and payment methods</p>
                            <span className="coming-soon">Coming Soon</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Open Session Modal */}
            {isSessionModalOpen && (
                <div className="modal-overlay" onClick={() => setIsSessionModalOpen(false)}>
                    <div className="modal-content session-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>🟢 Open New Session</h2>
                        <form onSubmit={handleOpenSession}>
                            <div className="form-group">
                                <label>POS Terminal *</label>
                                <select
                                    value={sessionFormData.pos_config_id}
                                    onChange={(e) => setSessionFormData({
                                        ...sessionFormData,
                                        pos_config_id: e.target.value
                                    })}
                                    required
                                >
                                    <option value="">Select Terminal</option>
                                    {posConfigs.map(config => (
                                        <option key={config.id} value={config.id}>
                                            {config.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Opening Balance ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={sessionFormData.opening_balance}
                                    onChange={(e) => setSessionFormData({
                                        ...sessionFormData,
                                        opening_balance: e.target.value
                                    })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setIsSessionModalOpen(false)}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Open Session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Close Session Modal */}
            {isCloseSessionModalOpen && currentSession && (
                <div className="modal-overlay" onClick={() => setIsCloseSessionModalOpen(false)}>
                    <div className="modal-content session-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>🔴 Close Session</h2>
                        <div className="session-summary">
                            <div className="summary-item">
                                <span>Terminal:</span>
                                <strong>{currentSession.pos_name}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Started:</span>
                                <strong>{formatDateTime(currentSession.open_date)}</strong>
                            </div>
                            <div className="summary-item">
                                <span>Orders:</span>
                                <strong>{currentSession.order_count || 0}</strong>
                            </div>
                            <div className="summary-item highlight">
                                <span>Total Sales:</span>
                                <strong>{formatCurrency(currentSession.total_sales || 0)}</strong>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Closing Balance ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={closingBalance}
                                onChange={(e) => setClosingBalance(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="modal-actions">
                            <button
                                type="button"
                                onClick={() => setIsCloseSessionModalOpen(false)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCloseSession}
                                className="submit-btn danger"
                            >
                                Close Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
