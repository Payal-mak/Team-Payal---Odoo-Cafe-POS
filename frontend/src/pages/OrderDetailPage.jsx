import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ChevronLeft, Calendar, User, Package, Monitor, Loader2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import './OrderDetailPage.css';

/* ─────────────────────────────────────
   Status badge
───────────────────────────────────── */
const STATUS_META = {
    draft: { label: 'Draft', cls: 'badge-amber' },
    sent_to_kitchen: { label: 'Sent to Kitchen', cls: 'badge-blue' },
    preparing: { label: 'Preparing', cls: 'badge-purple' },
    completed: { label: 'Completed', cls: 'badge-green' },
    paid: { label: 'Paid', cls: 'badge-green' },
    cancelled: { label: 'Cancelled', cls: 'badge-red' },
};

const StatusPill = ({ status }) => {
    const meta = STATUS_META[status] ?? { label: status, cls: 'badge-gray' };
    return <span className={`od-badge ${meta.cls}`}>{meta.label}</span>;
};

/* ─────────────────────────────────────
   Order Detail Page
───────────────────────────────────── */
const OrderDetailPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('products');

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            const r = await api.get(`/orders/${orderId}`);
            return r.data.data;
        },
        enabled: !!orderId
    });

    if (isLoading) {
        return (
            <div className="od-loading">
                <Loader2 className="spin" size={36} />
                <p>Loading order…</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="od-error">
                <Package size={48} />
                <p>Order not found</p>
                <button className="od-back-btn" onClick={() => navigate('/orders')}>
                    ← Back to Orders
                </button>
            </div>
        );
    }

    /* ── Computed totals from order items ─────── */
    const items = order.items ?? [];

    const subTotal = items.reduce((s, i) => s + Number(i.subtotal || 0), 0);
    const taxTotal = items.reduce((s, i) => s + Number(i.tax_amount || 0), 0);
    const grandTotal = subTotal + taxTotal;

    /* Extra Info: collect all variants from all items */
    const allVariants = items.flatMap(item =>
        (item.variants ?? []).map(v => ({ ...v, product_name: item.product_name }))
    );

    return (
        <div className="order-detail-page">

            {/* ── Header ───────────────────────────── */}
            <div className="od-header">
                <div className="od-header-left">
                    <button className="od-back" onClick={() => navigate('/orders')}>
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="od-title">
                            <Receipt size={20} />
                            {order.order_number ?? `Order #${order.id}`}
                        </h1>
                        <p className="od-subtitle">
                            {order.order_date
                                ? format(new Date(order.order_date), 'dd MMM yyyy, h:mm a')
                                : '—'}
                        </p>
                    </div>
                </div>
                <StatusPill status={order.status} />
            </div>

            {/* ── Info grid ────────────────────────── */}
            <div className="od-info-grid">
                <div className="od-info-card">
                    <div className="od-info-icon"><Calendar size={18} /></div>
                    <div>
                        <p className="od-info-label">Date</p>
                        <p className="od-info-value">
                            {order.order_date
                                ? format(new Date(order.order_date), 'dd MMM yyyy, h:mm a')
                                : '—'}
                        </p>
                    </div>
                </div>
                <div className="od-info-card">
                    <div className="od-info-icon"><Monitor size={18} /></div>
                    <div>
                        <p className="od-info-label">Session</p>
                        <p className="od-info-value">{order.session_id ? `S-${order.session_id}` : '—'}</p>
                    </div>
                </div>
                <div className="od-info-card">
                    <div className="od-info-icon"><User size={18} /></div>
                    <div>
                        <p className="od-info-label">Customer</p>
                        <p className="od-info-value">{order.customer_name || 'Walk-in'}</p>
                    </div>
                </div>
                <div className="od-info-card">
                    <div className="od-info-icon"><Package size={18} /></div>
                    <div>
                        <p className="od-info-label">Cashier</p>
                        <p className="od-info-value">{order.cashier_name || '—'}</p>
                    </div>
                </div>
            </div>

            {/* ── Tab bar ──────────────────────────── */}
            <div className="od-tabs">
                <button
                    className={`od-tab ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Products
                </button>
                <button
                    className={`od-tab ${activeTab === 'extra' ? 'active' : ''}`}
                    onClick={() => setActiveTab('extra')}
                >
                    Extra Info
                </button>
            </div>

            {/* ── Tab content ──────────────────────── */}
            <div className="od-tab-body">

                {/* Products tab */}
                {activeTab === 'products' && (
                    <div className="od-card">
                        <div className="od-table-wrap">
                            <table className="od-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>UOM</th>
                                        <th className="num">Qty</th>
                                        <th className="num">Unit Price</th>
                                        <th className="num">Tax %</th>
                                        <th className="num">Sub-Total</th>
                                        <th className="num">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length > 0 ? items.map((item, i) => {
                                        const sub = Number(item.unit_price) * Number(item.quantity);
                                        const tax = Number(item.tax_amount || 0);
                                        const total = sub + tax;
                                        const taxPct = sub > 0 ? Math.round((tax / sub) * 100) : 0;
                                        return (
                                            <tr key={item.id ?? i}>
                                                <td className="item-name">{item.product_name}</td>
                                                <td>Unit</td>
                                                <td className="num">{item.quantity}</td>
                                                <td className="num">₹{Number(item.unit_price).toFixed(2)}</td>
                                                <td className="num">{taxPct}%</td>
                                                <td className="num">₹{sub.toFixed(2)}</td>
                                                <td className="num total-col">₹{total.toFixed(2)}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={7} className="empty-row">No items in this order</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer totals */}
                        <div className="od-totals">
                            <div className="od-total-row">
                                <span>Total w/t Tax</span>
                                <span>₹{subTotal.toFixed(2)}</span>
                            </div>
                            <div className="od-total-row">
                                <span>Tax</span>
                                <span>₹{taxTotal.toFixed(2)}</span>
                            </div>
                            <div className="od-total-row grand">
                                <span>Final Total</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Extra Info tab */}
                {activeTab === 'extra' && (
                    <div className="od-card">
                        {allVariants.length > 0 ? (
                            <table className="od-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Variant</th>
                                        <th>Value</th>
                                        <th className="num">Extra Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allVariants.map((v, i) => (
                                        <tr key={i}>
                                            <td>{v.product_name}</td>
                                            <td>{v.attribute_name}</td>
                                            <td>{v.attribute_value}</td>
                                            <td className="num">₹{Number(v.extra_price || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="od-no-extra">
                                <Package size={40} />
                                <p>No extra information</p>
                                <span>This order has no variants or extras attached</span>
                            </div>
                        )}

                        {/* Additional order meta */}
                        {order.notes && (
                            <div className="od-notes">
                                <p className="od-notes-label">Notes</p>
                                <p className="od-notes-value">{order.notes}</p>
                            </div>
                        )}
                        {order.table_number && (
                            <div className="od-notes">
                                <p className="od-notes-label">Table</p>
                                <p className="od-notes-value">
                                    Table {order.table_number}
                                    {order.floor_name ? ` — ${order.floor_name}` : ''}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetailPage;
