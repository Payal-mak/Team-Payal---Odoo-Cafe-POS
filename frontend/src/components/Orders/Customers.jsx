import { useState, useEffect } from 'react';
import Header from '../Header/Header';
import './Orders.css';

const Customers = ({ user, onLogout, currentPage }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/orders/customers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setCustomers(data.data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            setError('Failed to load customers');
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
            day: 'numeric'
        });
    };

    return (
        <div className="orders-container">
            <Header user={user} onLogout={onLogout} currentPage={currentPage} />

            <main className="orders-main">
                <div className="page-header">
                    <h2 className="page-title">Customers</h2>
                    <p className="page-subtitle">Manage your customer database</p>
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
                            onClick={fetchCustomers}
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
                    ) : customers.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Total Orders</th>
                                    <th>Total Spent</th>
                                    <th>Joined Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.name}</td>
                                        <td>{customer.email || 'N/A'}</td>
                                        <td>{customer.total_orders || 0}</td>
                                        <td>{formatCurrency(customer.total_spent)}</td>
                                        <td>{formatDate(customer.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state-table">
                            <div className="empty-icon">👥</div>
                            <h4 className="empty-title">No Customers Yet</h4>
                            <p className="empty-description">Customer data will appear here</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Customers;
