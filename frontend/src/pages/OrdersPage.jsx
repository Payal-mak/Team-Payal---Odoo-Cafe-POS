import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Search, Filter, Trash2, Archive,
    Package, ChevronDown, Loader2,
    ShoppingCart, CreditCard, Users
} from 'lucide-react';
import { format } from 'date-fns';
import './OrdersPage.css';

/* ─────────────────────────────────────
   Status badge helper
───────────────────────────────────── */
const STATUS_META = {
    draft: { label: 'Draft', cls: 'badge-amber' },
    sent_to_kitchen: { label: 'Sent to Kitchen', cls: 'badge-blue' },
    preparing: { label: 'Preparing', cls: 'badge-purple' },
    completed: { label: 'Completed', cls: 'badge-green' },
    paid: { label: 'Paid', cls: 'badge-green' },
    cancelled: { label: 'Cancelled', cls: 'badge-red' },
};

const StatusBadge = ({ status }) => {
    const meta = STATUS_META[status] ?? { label: status, cls: 'badge-gray' };
    return <span className={`order-badge ${meta.cls}`}>{meta.label}</span>;
};

/* ─────────────────────────────────────
   Action dropdown (shown with rows selected)
───────────────────────────────────── */
const ActionDropdown = ({ count, onArchive, onDelete, disabled }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = e => ref.current && !ref.current.contains(e.target) && setOpen(false);
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div className="action-dropdown" ref={ref}>
            <button
                className="action-drop-btn"
                onClick={() => setOpen(v => !v)}
                disabled={disabled}
            >
                Actions <ChevronDown size={14} />
            </button>
            {open && (
                <div className="action-drop-menu">
                    <button className="adm-item" onClick={() => { onArchive(); setOpen(false); }}>
                        <Archive size={14} /> Archive
                    </button>
                    <button className="adm-item danger" onClick={() => { onDelete(); setOpen(false); }}>
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────
   Orders Page
───────────────────────────────────── */
const OrdersPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const qc = useQueryClient();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selected, setSelected] = useState([]);

    /* ── Fetch orders with filters ──────────────── */
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders', statusFilter],
        queryFn: async () => {
            const r = await api.get(`/orders?${params.toString()}`);
            return r.data.data ?? [];
        }
    });

    /* ── Local filters (search + date) ─────────── */
    const filtered = orders.filter(o => {
        if (search) {
            const s = search.toLowerCase();
            if (
                !o.order_number?.toLowerCase().includes(s) &&
                !o.id.toString().includes(s) &&
                !o.customer_name?.toLowerCase().includes(s)
            ) return false;
        }
        if (dateFrom && new Date(o.order_date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(o.order_date) > new Date(dateTo + 'T23:59:59')) return false;
        return true;
    });

    /* ── Mutations ──────────────────────────────── */
    const archiveMut = useMutation({
        mutationFn: async (ids) =>
            Promise.all(ids.map(id => api.put(`/orders/${id}`, { status: 'cancelled' }))),
        onSuccess: () => { toast.success('Archived'); setSelected([]); qc.invalidateQueries(['orders']); },
        onError: () => toast.error('Archive failed')
    });

    const deleteMut = useMutation({
        mutationFn: async (ids) =>
            Promise.all(ids.map(id => api.delete(`/orders/${id}`))),
        onSuccess: () => { toast.success('Deleted'); setSelected([]); qc.invalidateQueries(['orders']); },
        onError: (e) => toast.error(e.response?.data?.message || 'Delete failed')
    });

    /* ── Selection helpers ──────────────────────── */
    const toggleSelect = id =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleAll = () =>
        setSelected(selected.length === filtered.length ? [] : filtered.map(o => o.id));

    const draftSelected = selected.filter(id =>
        orders.find(o => o.id === id)?.status === 'draft'
    );

    const handleArchive = () => {
        if (!draftSelected.length) { toast.error('Select draft orders to archive'); return; }
        if (!window.confirm(`Archive ${draftSelected.length} draft order(s)?`)) return;
        archiveMut.mutate(draftSelected);
    };

    const handleDelete = () => {
        if (!draftSelected.length) { toast.error('Can only delete draft orders'); return; }
        if (!window.confirm(`Delete ${draftSelected.length} draft order(s)?`)) return;
        deleteMut.mutate(draftSelected);
    };

    const isBusy = archiveMut.isPending || deleteMut.isPending;

    /* ── Sub-nav active detection ───────────────── */
    const activePath = location.pathname;

    return (
        <div className="orders-page">

            {/* Sub-nav tabs */}
            <div className="orders-subnav">
                <Link to="/orders" className={`subnav-tab ${activePath === '/orders' ? 'active' : ''}`}>
                    <ShoppingCart size={15} /> Orders
                </Link>
                <Link to="/payments" className={`subnav-tab ${activePath === '/payments' ? 'active' : ''}`}>
                    <CreditCard size={15} /> Payment
                </Link>
                <Link to="/customers" className={`subnav-tab ${activePath === '/customers' ? 'active' : ''}`}>
                    <Users size={15} /> Customer
                </Link>
            </div>

            {/* Page header */}
            <div className="op-header">
                <div>
                    <h1 className="op-title">Orders</h1>
                    <p className="op-subtitle">View and manage all POS orders</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="op-toolbar">
                {/* Search */}
                <div className="op-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search by order #, customer…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Status filter */}
                <div className="op-filter-group">
                    <Filter size={14} />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent_to_kitchen">Sent to Kitchen</option>
                        <option value="preparing">Preparing</option>
                        <option value="completed">Completed</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Date range */}
                <div className="op-date-range">
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        title="From date"
                    />
                    <span className="date-sep">–</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        title="To date"
                    />
                </div>

                {/* Bulk actions (when selected) */}
                {selected.length > 0 && (
                    <div className="op-bulk">
                        <span className="bulk-count">{selected.length} Selected</span>
                        <ActionDropdown
                            count={selected.length}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                            disabled={isBusy}
                        />
                    </div>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="op-loading">
                    <Loader2 className="spin" size={32} />
                    <p>Loading orders…</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="op-table-wrap">
                    <table className="op-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        className="op-checkbox"
                                        checked={selected.length === filtered.length && filtered.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th>Order #</th>
                                <th>Session</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Customer</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(order => (
                                <tr
                                    key={order.id}
                                    className="op-row"
                                    onClick={e => {
                                        if (e.target.type === 'checkbox') return;
                                        navigate(`/orders/${order.id}`);
                                    }}
                                >
                                    <td onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="op-checkbox"
                                            checked={selected.includes(order.id)}
                                            onChange={() => toggleSelect(order.id)}
                                        />
                                    </td>
                                    <td className="order-num">{order.order_number ?? `#${order.id}`}</td>
                                    <td className="order-session">
                                        {order.session_id ? `S-${order.session_id}` : '—'}
                                    </td>
                                    <td>{order.order_date
                                        ? format(new Date(order.order_date), 'dd MMM yyyy, h:mm a')
                                        : '—'}</td>
                                    <td className="order-total">₹{Number(order.total_amount || 0).toFixed(2)}</td>
                                    <td>{order.customer_name || <span className="muted">Walk-in</span>}</td>
                                    <td><StatusBadge status={order.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="op-empty">
                    <Package size={48} />
                    <p>No orders found</p>
                    <span>Orders will appear here once created in the POS</span>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
