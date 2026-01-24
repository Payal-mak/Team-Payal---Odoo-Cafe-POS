import { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTerminalName, setNewTerminalName] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setDashboardData(data.data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTerminal = async (e) => {
        e.preventDefault();

        if (!newTerminalName.trim()) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/dashboard/terminal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newTerminalName })
            });

            const data = await response.json();

            if (data.success) {
                setShowModal(false);
                setNewTerminalName('');
                fetchDashboardData();
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error creating terminal:', error);
            setError('Failed to create terminal');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid #e0e0e0', borderTopColor: 'var(--accent-orange)' }}></div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-logo-section">
                        <img src="/logo.png" alt="Odoo Cafe" className="dashboard-logo" />
                        <div className="dashboard-brand">
                            <h1>Odoo Cafe POS</h1>
                            <p>Point of Sale System</p>
                        </div>
                    </div>

                    <nav className="dashboard-nav">
                        <div className="nav-item">
                            <a href="#orders" className="nav-link">
                                📋 Orders
                            </a>
                        </div>
                        <div className="nav-item">
                            <a href="#products" className="nav-link">
                                🍕 Products
                            </a>
                        </div>
                        <div className="nav-item">
                            <a href="#reporting" className="nav-link">
                                📊 Reporting
                            </a>
                        </div>
                    </nav>

                    <div className="dashboard-user">
                        <div className="user-info">
                            <span className="user-name">{user?.username || 'User'}</span>
                            <span className="user-role">{user?.role || 'POS User'}</span>
                        </div>
                        <div className="user-avatar">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <button className="btn btn-outline logout-btn" onClick={onLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <h2 className="dashboard-title">Dashboard</h2>
                <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                        <span>⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-label">Total Orders</div>
                                <div className="stat-value">{dashboardData?.stats?.totalOrders || 0}</div>
                            </div>
                            <div className="stat-icon orders">📋</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-label">Total Revenue</div>
                                <div className="stat-value">{formatCurrency(dashboardData?.stats?.totalRevenue)}</div>
                            </div>
                            <div className="stat-icon revenue">💰</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-label">Total Products</div>
                                <div className="stat-value">{dashboardData?.stats?.totalProducts || 0}</div>
                            </div>
                            <div className="stat-icon products">🍕</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div>
                                <div className="stat-label">Draft Orders</div>
                                <div className="stat-value">{dashboardData?.stats?.draftOrders || 0}</div>
                            </div>
                            <div className="stat-icon draft">📝</div>
                        </div>
                    </div>
                </div>

                {/* Terminals Section */}
                <section className="terminals-section">
                    <div className="section-header">
                        <h3 className="section-title">POS Terminals</h3>
                        <button className="btn btn-primary add-terminal-btn" onClick={() => setShowModal(true)}>
                            <span>➕</span>
                            <span>New Terminal</span>
                        </button>
                    </div>

                    {dashboardData?.terminals?.length > 0 ? (
                        <div className="terminals-grid">
                            {dashboardData.terminals.map((terminal) => (
                                <div key={terminal.id} className="terminal-card">
                                    <div className="terminal-header">
                                        <div className="terminal-menu">
                                            <button className="menu-btn">⋮</button>
                                        </div>
                                        <h4 className="terminal-name">{terminal.name}</h4>
                                        <p className="terminal-status">Terminal #{terminal.id}</p>
                                    </div>
                                    <div className="terminal-body">
                                        <div className="terminal-info">
                                            <div className="info-row">
                                                <span className="info-label">Last Session</span>
                                                <span className="info-value">{formatDate(terminal.open_date)}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Last Sale</span>
                                                <span className="info-value">{formatCurrency(terminal.last_closing_sale_amount)}</span>
                                            </div>
                                        </div>
                                        <div className="terminal-actions">
                                            <button className="btn btn-primary action-btn">
                                                Open Session
                                            </button>
                                            <button className="btn btn-outline action-btn">
                                                Settings
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🖥️</div>
                            <h4 className="empty-title">No POS Terminals Yet</h4>
                            <p className="empty-description">Create your first POS terminal to get started</p>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                Create Terminal
                            </button>
                        </div>
                    )}
                </section>
            </main>

            {/* Create Terminal Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create New Terminal</h3>
                            <p className="modal-description">Enter a name for your new POS terminal</p>
                        </div>
                        <form onSubmit={handleCreateTerminal}>
                            <div className="input-group">
                                <label htmlFor="terminalName">Terminal Name</label>
                                <input
                                    type="text"
                                    id="terminalName"
                                    value={newTerminalName}
                                    onChange={(e) => setNewTerminalName(e.target.value)}
                                    placeholder="e.g., Main Counter, Drive-Thru"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Terminal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
