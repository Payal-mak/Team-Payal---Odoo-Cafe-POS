import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    DollarSign,
    ShoppingBag,
    Users,
    Monitor,
    Play,
    Clock,
    TrendingUp,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import './DashboardPage.css';

const DashboardPage = () => {
    const queryClient = useQueryClient();
    const [openingSession, setOpeningSession] = useState(null);

    // Fetch dashboard statistics
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/reports/dashboard');
            return response.data.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Fetch POS terminals
    const { data: terminalsData, isLoading: terminalsLoading } = useQuery({
        queryKey: ['terminals'],
        queryFn: async () => {
            const response = await api.get('/terminals');
            return response.data.data;
        }
    });

    // Fetch active sessions
    const { data: sessionsData } = useQuery({
        queryKey: ['active-sessions'],
        queryFn: async () => {
            const response = await api.get('/sessions/active');
            return response.data.data;
        }
    });

    // Open session mutation
    const openSessionMutation = useMutation({
        mutationFn: async (terminalId) => {
            const response = await api.post('/sessions/open', {
                terminal_id: terminalId,
                opening_balance: 0
            });
            return response.data;
        },
        onSuccess: (data) => {
            toast.success('Session opened successfully!');
            queryClient.invalidateQueries(['active-sessions']);
            queryClient.invalidateQueries(['dashboard-stats']);
            setOpeningSession(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to open session');
            setOpeningSession(null);
        }
    });

    const handleOpenSession = (terminalId) => {
        setOpeningSession(terminalId);
        openSessionMutation.mutate(terminalId);
    };

    const getTerminalSession = (terminalId) => {
        return sessionsData?.find(session => session.terminal_id === terminalId);
    };

    if (statsLoading || terminalsLoading) {
        return (
            <Layout>
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading dashboard...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="dashboard">
                <div className="dashboard-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p className="dashboard-subtitle">
                            <Calendar size={16} />
                            {format(new Date(), 'EEEE, MMMM d, yyyy')}
                        </p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="stats-grid">
                    <div className="stat-card revenue">
                        <div className="stat-icon">
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Today's Revenue</p>
                            <h3 className="stat-value">
                                ₹{Number(stats?.today_sales?.total_revenue || 0).toFixed(2)}
                            </h3>
                            <p className="stat-meta">
                                <TrendingUp size={14} />
                                {stats?.today_sales?.total_orders || 0} orders
                            </p>
                        </div>
                    </div>

                    <div className="stat-card orders">
                        <div className="stat-icon">
                            <ShoppingBag size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Active Orders</p>
                            <h3 className="stat-value">{stats?.active_orders || 0}</h3>
                            <p className="stat-meta">In progress</p>
                        </div>
                    </div>

                    <div className="stat-card tables">
                        <div className="stat-icon">
                            <Users size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Tables Occupied</p>
                            <h3 className="stat-value">
                                {stats?.occupied_tables || 0}/{stats?.total_tables || 0}
                            </h3>
                            <p className="stat-meta">
                                {stats?.total_tables ?
                                    Math.round((stats.occupied_tables / stats.total_tables) * 100) : 0}% occupancy
                            </p>
                        </div>
                    </div>

                    <div className="stat-card sessions">
                        <div className="stat-icon">
                            <Monitor size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-label">Active Sessions</p>
                            <h3 className="stat-value">{stats?.active_sessions || 0}</h3>
                            <p className="stat-meta">POS terminals</p>
                        </div>
                    </div>
                </div>

                {/* POS Terminals */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>POS Terminals</h2>
                        <p>Manage your point of sale terminals and sessions</p>
                    </div>

                    <div className="terminals-grid">
                        {terminalsData && terminalsData.length > 0 ? (
                            terminalsData.map((terminal) => {
                                const session = getTerminalSession(terminal.id);
                                const isActive = !!session;

                                return (
                                    <div key={terminal.id} className={`terminal-card ${isActive ? 'active' : ''}`}>
                                        <div className="terminal-header">
                                            <div className="terminal-info">
                                                <h3>{terminal.name}</h3>
                                                <p className="terminal-location">{terminal.location || 'Main Floor'}</p>
                                            </div>
                                            <div className={`terminal-status ${isActive ? 'active' : 'inactive'}`}>
                                                {isActive ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>

                                        {isActive && session ? (
                                            <div className="session-info">
                                                <div className="session-detail">
                                                    <Clock size={16} />
                                                    <span>
                                                        Opened: {session.start_time ? format(new Date(session.start_time), 'h:mm a') : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="session-detail">
                                                    <DollarSign size={16} />
                                                    <span>Balance: ₹{Number(session.opening_balance || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="terminal-actions">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleOpenSession(terminal.id)}
                                                    disabled={openingSession === terminal.id}
                                                >
                                                    {openingSession === terminal.id ? (
                                                        <>
                                                            <span className="spinner"></span>
                                                            Opening...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={18} />
                                                            Open Session
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-state">
                                <Monitor size={48} />
                                <p>No POS terminals configured</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Selling Products */}
                {stats?.top_products && stats.top_products.length > 0 && (
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Top Selling Products Today</h2>
                            <p>Best performing items</p>
                        </div>
                        <div className="card">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity Sold</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.top_products.map((product, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="product-cell">
                                                    <span className="product-rank">#{index + 1}</span>
                                                    {product.name}
                                                </div>
                                            </td>
                                            <td>{product.quantity_sold} units</td>
                                            <td className="revenue-cell">₹{Number(product.revenue || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DashboardPage;
