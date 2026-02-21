import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    Calendar,
    MoreVertical,
    Settings,
    ChefHat,
    Tv,
    RefreshCw,
    Loader2,
    Zap
} from 'lucide-react';
import { format } from 'date-fns';
import './DashboardPage.css';

/* ── Three-dot menu — closes on outside click ─────────────── */
const TerminalMenu = ({ terminal, onNavigate }) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const go = (path) => { setOpen(false); navigate(path); };

    return (
        <div className="terminal-menu" ref={menuRef}>
            <button className="menu-btn" onClick={() => setOpen(v => !v)} aria-label="Terminal options">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="terminal-dropdown">
                    <button className="td-item" onClick={() => go(`/settings/${terminal.id}`)}>
                        <Settings size={15} /> Settings
                    </button>
                    <button className="td-item" onClick={() => go('/kitchen')}>
                        <ChefHat size={15} /> Kitchen Display
                    </button>
                    <button className="td-item" onClick={() => go('/customer-display')}>
                        <Tv size={15} /> Customer Display
                    </button>
                </div>
            )}
        </div>
    );
};

/* ── Terminal card ────────────────────────────────────────── */
const TerminalCard = ({ terminal, session, onOpenSession, opening }) => {
    const navigate = useNavigate();
    const hasSession = !!session;

    const handleSessionBtn = async () => {
        if (hasSession) {
            // Resume — just navigate to POS
            navigate('/pos');
        } else {
            // Open new session
            await onOpenSession(terminal.id);
        }
    };

    return (
        <div className={`terminal-card ${hasSession ? 'active' : ''}`}>
            {/* Header row */}
            <div className="tc-header">
                <div className="tc-info">
                    <h3 className="tc-name">{terminal.name}</h3>
                    <p className="tc-location">{terminal.location || 'Main Floor'}</p>
                </div>
                <div className="tc-header-right">
                    <span className={`tc-status ${hasSession ? 'active' : 'inactive'}`}>
                        {hasSession ? 'Active' : 'Inactive'}
                    </span>
                    <TerminalMenu terminal={terminal} />
                </div>
            </div>

            {/* Session details */}
            <div className="tc-details">
                <div className="tc-detail-row">
                    <Clock size={14} />
                    <span>
                        Last opened: {
                            session?.start_time
                                ? format(new Date(session.start_time), 'dd MMM, h:mm a')
                                : terminal.last_opened
                                    ? format(new Date(terminal.last_opened), 'dd MMM, h:mm a')
                                    : 'N/A'
                        }
                    </span>
                </div>
                <div className="tc-detail-row">
                    <DollarSign size={14} />
                    <span>
                        Last sell: ₹{Number(
                            session?.total_sales ??
                            terminal.last_sell_amount ??
                            0
                        ).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Action button */}
            <button
                className={`tc-btn ${hasSession ? 'resume' : 'open'}`}
                onClick={handleSessionBtn}
                disabled={opening}
            >
                {opening ? (
                    <><Loader2 size={16} className="spin" /> Opening…</>
                ) : hasSession ? (
                    <><RefreshCw size={16} /> Resume Session</>
                ) : (
                    <><Play size={16} /> Open Session</>
                )}
            </button>
        </div>
    );
};

/* ── Stat card ────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, meta, colorClass }) => (
    <div className={`stat-card ${colorClass}`}>
        <div className="stat-icon">
            <Icon size={22} />
        </div>
        <div className="stat-content">
            <p className="stat-label">{label}</p>
            <h3 className="stat-value">{value}</h3>
            <p className="stat-meta">{meta}</p>
        </div>
    </div>
);

/* ── Dashboard page ───────────────────────────────────────── */
const DashboardPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [openingId, setOpeningId] = useState(null);


    /* Stats */
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const r = await api.get('/reports/dashboard');
            return r.data.data;
        },
        refetchInterval: 30000,
    });

    /* Terminals (GET /terminals — backend calls them POS configs) */
    const { data: terminals = [], isLoading: terminalsLoading } = useQuery({
        queryKey: ['terminals'],
        queryFn: async () => {
            const r = await api.get('/terminals');
            return r.data.data ?? [];
        }
    });

    /* Active sessions */
    const { data: sessions = [] } = useQuery({
        queryKey: ['active-sessions'],
        queryFn: async () => {
            const r = await api.get('/sessions/active');
            return r.data.data ?? [];
        }
    });

    /* Open session mutation */
    const openSessionMut = useMutation({
        mutationFn: async (terminalId) => {
            const r = await api.post('/sessions/open', {
                terminal_id: terminalId,
                opening_balance: 0
            });
            return r.data;
        },
        onSuccess: () => {
            toast.success('Session opened!');
            queryClient.invalidateQueries(['active-sessions']);
            queryClient.invalidateQueries(['dashboard-stats']);
            setOpeningId(null);
            navigate('/pos');
        },

        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to open session');
            setOpeningId(null);
        }
    });

    const handleOpenSession = (terminalId) => {
        setOpeningId(terminalId);
        openSessionMut.mutate(terminalId);
    };

    const getSession = (terminalId) =>
        sessions.find(s => s.terminal_id === terminalId);

    const isLoading = statsLoading || terminalsLoading;

    if (isLoading) {
        return (
            <div className="db-loading">
                <Loader2 className="spin" size={40} />
                <p>Loading dashboard…</p>
            </div>
        );
    }

    return (
        <div className="dashboard">

            {/* Page header */}
            <div className="db-header">
                <div>
                    <h1 className="db-title">Dashboard</h1>
                    <p className="db-subtitle">
                        <Calendar size={15} />
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                </div>
                <button
                    className="db-refresh-btn"
                    onClick={() => {
                        queryClient.invalidateQueries();
                        toast.success('Refreshed');
                    }}
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Stats grid */}
            <div className="stats-grid">
                <StatCard
                    icon={DollarSign}
                    label="Today's Revenue"
                    value={`₹${Number(stats?.today_sales?.total_revenue || 0).toFixed(2)}`}
                    meta={<><TrendingUp size={13} /> {stats?.today_sales?.total_orders || 0} orders</>}
                    colorClass="revenue"
                />
                <StatCard
                    icon={ShoppingBag}
                    label="Active Orders"
                    value={stats?.active_orders ?? 0}
                    meta="In progress"
                    colorClass="orders"
                />
                <StatCard
                    icon={Users}
                    label="Tables Occupied"
                    value={`${stats?.occupied_tables ?? 0}/${stats?.total_tables ?? 0}`}
                    meta={`${stats?.total_tables
                        ? Math.round((stats.occupied_tables / stats.total_tables) * 100)
                        : 0}% occupancy`}
                    colorClass="tables"
                />
                <StatCard
                    icon={Monitor}
                    label="Active Sessions"
                    value={stats?.active_sessions ?? 0}
                    meta="POS terminals"
                    colorClass="sessions"
                />
            </div>

            {/* POS Terminals */}
            <div className="db-section">
                <div className="db-section-header">
                    <div>
                        <h2><Zap size={18} /> POS Terminals</h2>
                        <p>Manage your point of sale terminals and sessions</p>
                    </div>
                </div>

                <div className="terminals-grid">
                    {terminals.length > 0 ? terminals.map(terminal => (
                        <TerminalCard
                            key={terminal.id}
                            terminal={terminal}
                            session={getSession(terminal.id)}
                            onOpenSession={handleOpenSession}
                            opening={openingId === terminal.id}
                        />
                    )) : (
                        <div className="empty-state">
                            <Monitor size={48} />
                            <p>No POS terminals configured</p>
                            <span>Ask your admin to add terminals</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Top products table (when data available) */}
            {stats?.top_products?.length > 0 && (
                <div className="db-section">
                    <div className="db-section-header">
                        <div>
                            <h2>Top Selling Products Today</h2>
                            <p>Best performing items</p>
                        </div>
                    </div>
                    <div className="db-card">
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Qty Sold</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.top_products.map((p, i) => (
                                    <tr key={i}>
                                        <td><span className="rank-badge">#{i + 1}</span></td>
                                        <td>{p.name}</td>
                                        <td>{p.quantity_sold} units</td>
                                        <td className="revenue-cell">₹{Number(p.revenue || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
