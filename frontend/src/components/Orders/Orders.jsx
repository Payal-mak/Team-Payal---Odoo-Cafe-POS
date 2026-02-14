import { useState, useEffect } from 'react';
import Header from '../Header/Header';
import './Orders.css';

const Orders = ({ user, onLogout, currentPage }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setOrders(data.data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedOrders(orders.map(order => order.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (orderId) => {
        if (selectedOrders.includes(orderId)) {
            setSelectedOrders(selectedOrders.filter(id => id !== orderId));
        } else {
            setSelectedOrders([...selectedOrders, orderId]);
        }
    };

    const handleDeleteOrders = async () => {
        if (selectedOrders.length === 0) return;

        if (!confirm(`Delete ${selectedOrders.length} order(s)?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ids: selectedOrders })
            });

            const data = await response.json();

            if (data.success) {
                setSelectedOrders([]);
                fetchOrders();
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error deleting orders:', error);
            setError('Failed to delete orders');
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
                    <h2 className="page-title">Orders</h2>
                    <p className="page-subtitle">Manage all your orders in one place</p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                        <span>⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="action-bar">
                    <div className="action-left">
                        {selectedOrders.length > 0 && (
                            <>
                                <span className="select-info">
                                    {selectedOrders.length} selected
                                </span>
                                <button
                                    className="btn btn-outline"
                                    onClick={handleDeleteOrders}
                                    style={{ padding: '8px 16px', fontSize: '14px' }}
                                >
                                    🗑️ Delete
                                </button>
                            </>
                        )}
                    </div>
                    <div className="action-right">
                        <button
                            className="btn btn-outline"
                            onClick={fetchOrders}
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
                    ) : orders.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="checkbox-col">
                                        <input
                                            type="checkbox"
                                            className="checkbox-input"
                                            checked={selectedOrders.length === orders.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Order Number</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Table</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className={selectedOrders.includes(order.id) ? 'selected' : ''}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => handleSelectOrder(order.id)}
                                            />
                                        </td>
                                        <td>
                                            <a href={`#order/${order.id}`} className="order-link">
                                                {order.order_number}
                                            </a>
                                        </td>
                                        <td>{formatDate(order.date)}</td>
                                        <td>{order.customer_name || 'Walk-in'}</td>
                                        <td>Table {order.table_number || '-'}</td>
                                        <td>{formatCurrency(order.total_amount)}</td>
                                        <td>
                                            <span className={`status-badge ${order.status}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${order.payment_status}`}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state-table">
                            <div className="empty-icon">📋</div>
                            <h4 className="empty-title">No Orders Yet</h4>
                            <p className="empty-description">Orders will appear here once created</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Orders;
