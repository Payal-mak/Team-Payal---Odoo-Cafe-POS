import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    ChevronRight, ChevronDown,
    Banknote, CreditCard, Smartphone, Building2,
    ShoppingCart, Users, Loader2, Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import './PaymentsPage.css';

/* ── Method display config ───────────────────────────────── */
const METHOD_META = {
    cash: { label: 'Cash', Icon: Banknote, cls: 'method-cash' },
    card: { label: 'Credit / Debit Card', Icon: CreditCard, cls: 'method-card' },
    upi: { label: 'UPI', Icon: Smartphone, cls: 'method-upi' },
    bank: { label: 'Bank Transfer', Icon: Building2, cls: 'method-bank' },
};

const getMeta = (method) =>
    METHOD_META[method?.toLowerCase()] ?? {
        label: method ?? 'Other',
        Icon: Wallet,
        cls: 'method-other',
    };

/* ── Single collapsible group ────────────────────────────── */
const PaymentGroup = ({ method, payments, total }) => {
    const [open, setOpen] = useState(false);
    const { label, Icon, cls } = getMeta(method);

    return (
        <div className={`pg-group ${open ? 'open' : ''}`}>
            {/* Group header */}
            <button className="pg-header" onClick={() => setOpen(v => !v)}>
                <div className="pg-header-left">
                    <span className="pg-chevron">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <span className={`pg-method-icon ${cls}`}>
                        <Icon size={16} />
                    </span>
                    <span className="pg-method-label">{label}</span>
                    <span className="pg-count">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
                </div>
                <span className="pg-group-total">₹{total.toFixed(2)}</span>
            </button>

            {/* Expandable rows */}
            {open && (
                <div className="pg-rows">
                    <table className="pg-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Order #</th>
                                <th>Ref / UPI ID</th>
                                <th className="amt-col">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p.id} className="pg-row">
                                    <td>
                                        {p.payment_date
                                            ? format(new Date(p.payment_date), 'dd MMM yyyy, h:mm a')
                                            : '—'}
                                    </td>
                                    <td className="pg-order-num">
                                        {p.order_number ?? `#${p.order_id}`}
                                    </td>
                                    <td className="pg-ref">
                                        {p.upi_id || p.transaction_reference || <span className="muted">—</span>}
                                    </td>
                                    <td className="amt-col pg-amount">
                                        ₹{Number(p.amount || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="pg-subtotal-row">
                                <td colSpan={3} className="pg-subtotal-label">Subtotal — {label}</td>
                                <td className="amt-col">₹{total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

/* ── Payments page ───────────────────────────────────────── */
const PaymentsPage = () => {
    const location = useLocation();

    /* Fetch flat payment list — group client-side */
    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const r = await api.get('/payments');
            return r.data.data ?? [];
        }
    });

    /* Group by payment_method, sort groups by total desc */
    const groups = Object.entries(
        payments.reduce((acc, p) => {
            const key = p.payment_method ?? 'other';
            if (!acc[key]) acc[key] = [];
            acc[key].push(p);
            return acc;
        }, {})
    )
        .map(([method, list]) => ({
            method,
            payments: list,
            total: list.reduce((s, p) => s + Number(p.amount || 0), 0),
        }))
        .sort((a, b) => b.total - a.total);

    const grandTotal = groups.reduce((s, g) => s + g.total, 0);

    return (
        <div className="payments-page">

            {/* Sub-nav (shared with Orders / Customers) */}
            <div className="orders-subnav">
                <Link to="/orders" className={`subnav-tab ${location.pathname === '/orders' ? 'active' : ''}`}>
                    <ShoppingCart size={15} /> Orders
                </Link>
                <Link to="/payments" className={`subnav-tab ${location.pathname === '/payments' ? 'active' : ''}`}>
                    <CreditCard size={15} /> Payment
                </Link>
                <Link to="/customers" className={`subnav-tab ${location.pathname === '/customers' ? 'active' : ''}`}>
                    <Users size={15} /> Customer
                </Link>
            </div>

            {/* Page header */}
            <div className="pp-header">
                <div>
                    <h1 className="pp-title">Payments</h1>
                    <p className="pp-subtitle">All transactions grouped by payment method</p>
                </div>
                {!isLoading && (
                    <div className="pp-grand-total">
                        <span className="pp-grand-label">Grand Total</span>
                        <span className="pp-grand-value">₹{grandTotal.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="pp-loading">
                    <Loader2 className="spin" size={32} />
                    <p>Loading payments…</p>
                </div>
            ) : groups.length === 0 ? (
                <div className="pp-empty">
                    <Wallet size={48} />
                    <p>No payments recorded yet</p>
                    <span>Payments appear here once orders are paid</span>
                </div>
            ) : (
                <div className="pp-groups">
                    {groups.map(g => (
                        <PaymentGroup
                            key={g.method}
                            method={g.method}
                            payments={g.payments}
                            total={g.total}
                        />
                    ))}

                    {/* Grand total footer */}
                    <div className="pp-footer">
                        <span className="pp-footer-label">Total across all methods</span>
                        <span className="pp-footer-value">₹{grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;
