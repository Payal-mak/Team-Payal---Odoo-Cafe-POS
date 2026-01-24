import { useState, useEffect, useRef } from 'react';
import Header from '../Header/Header';
import './Dashboard.css';

const Dashboard = ({ user, onLogout, onNavigate }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const handleCreateTerminal = async (name) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/dashboard/terminal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });

            const data = await response.json();

            if (data.success) {
                fetchDashboardData();
                alert('Terminal created successfully!');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error creating terminal:', error);
            alert('Failed to create terminal');
        }
    };

    const handleOpenSession = async (terminalId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/dashboard/terminal/${terminalId}/session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                alert('Session opened successfully!');
                fetchDashboardData();
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error opening session:', error);
            setError('Failed to open session');
        }
    };

    const handleMenuAction = (action, terminalId) => {
        setActiveMenu(null);

        switch (action) {
            case 'setting':
                onNavigate('settings', terminalId);
                break;
            case 'kitchen':
                alert('Kitchen Display feature coming soon');
                break;
            case 'customer':
                alert('Customer Display feature coming soon');
                break;
            default:
                break;
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
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
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
            <Header user={user} onLogout={onLogout} currentPage="dashboard" onNavigate={onNavigate} />

            {/* Main Content */}
            <main className="dashboard-main">
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                        <span>⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Stats Cards */}
                <section className="stats-grid">
                    {/* ... stats cards ... */}
                </section>

                {/* POS Terminals Section */}
                <section className="terminals-section">
                    <div className="section-header">
                        <h2 className="section-title">POS Terminals</h2>
                        <button
                            className="btn btn-secondary add-terminal-btn"
                            onClick={() => {
                                const name = prompt('Enter new terminal name:');
                                if (name) handleCreateTerminal(name);
                            }}
                        >
                            ➕ New Terminal
                        </button>
                    </div>

                    {dashboardData?.terminals?.length > 0 ? (
                        <div className="terminals-grid">
                            {dashboardData.terminals.map((terminal) => (
                                <div key={terminal.id} className="terminal-card">
                                    <div className="terminal-header">
                                        <div className="terminal-menu">
                                            <button
                                                className="menu-btn"
                                                onClick={() => onNavigate('settings', terminal.id)}
                                                title="Settings"
                                            >
                                                ⚙️
                                            </button>
                                        </div>
                                        <h3 className="terminal-name">{terminal.name}</h3>
                                        <div className="terminal-status">
                                            🟢 Online • v1.0.0
                                        </div>
                                    </div>
                                    <div className="terminal-body">
                                        <div className="terminal-info">
                                            <div className="info-row">
                                                <span className="info-label">Last Session</span>
                                                <span className="info-value">{formatDate(terminal.last_session_date)}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Last Closing</span>
                                                <span className="info-value">{formatCurrency(terminal.last_closing_sale_amount)}</span>
                                            </div>
                                        </div>
                                        <div className="terminal-actions">
                                            <button
                                                className="btn btn-primary action-btn"
                                                onClick={() => handleOpenSession(terminal.id)}
                                            >
                                                Open Session
                                            </button>
                                            <button
                                                className="btn btn-outline action-btn"
                                                onClick={() => onNavigate('settings', terminal.id)}
                                            >
                                                Configure
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🖥️</div>
                            <h3 className="empty-title">No POS Terminals</h3>
                            <p className="empty-description">Create your first terminal to get started</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    const name = prompt('Enter new terminal name:');
                                    if (name) handleCreateTerminal(name);
                                }}
                            >
                                ➕ Create Terminal
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
