import { useState, useEffect } from 'react';
import Header from '../Header/Header';
import './Orders.css';

const Payments = ({ user, onLogout, currentPage }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/orders/payments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setPayments(data.data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            setError('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="orders-container">
            <Header user={user} onLogout={onLogout} currentPage={currentPage} />

            <main className="orders-main">
                <div className="page-header">
                    <h2 className="page-title">Payments</h2>
                    <p className="page-subtitle">View all payment transactions</p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                        <span>⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="action-bar">
                    <div className="action-left"></div>
                    <div className="action-right">
                        <button
                            className="btn btn-outline"
                            onClick={fetchPayments}
                            style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <div className="data-table-container">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid #e0e0e0', borderTopColor: 'var(--accent-orange)' }}></div>
                        </div>
                    ) : payments.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order Number</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Payment Method</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <a href={`#order/${payment.id}`} className="order-link">
                                                {payment.order_number}
                                            </a>
                                        </td>
                                        <td>{formatDate(payment.date)}</td>
                                        <td>{payment.customer_name || 'Walk-in'}</td>
                                        <td>{formatCurrency(payment.total_amount)}</td>
                                        <td>
                                            <span className={`status-badge ${payment.payment_method}`}>
                                                {payment.payment_method || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${payment.payment_status}`}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state-table">
                            <div className="empty-icon">💳</div>
                            <h4 className="empty-title">No Payments Yet</h4>
                            <p className="empty-description">Payment transactions will appear here</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Payments;
