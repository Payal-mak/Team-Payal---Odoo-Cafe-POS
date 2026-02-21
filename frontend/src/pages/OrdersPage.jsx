import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Search,
    Filter,
    Eye,
    Trash2,
    Archive,
    X,
    Package,
    User,
    Calendar,
    DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import './OrdersPage.css';

const OrdersPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('products');

    // Fetch orders
    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['orders', statusFilter],
        queryFn: async () => {
            const url = statusFilter
                ? `/orders?status=${statusFilter}`
                : '/orders';
            const response = await api.get(url);
            return response.data.data;
        }
    });

    // Delete order mutation
    const deleteMutation = useMutation({
        mutationFn: async (orderId) => {
            await api.delete(`/orders/${orderId}`);
        },
        onSuccess: () => {
            toast.success('Order deleted successfully');
            queryClient.invalidateQueries(['orders']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete order');
        }
    });

    // Bulk delete mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (orderIds) => {
            await Promise.all(orderIds.map(id => api.delete(`/orders/${id}`)));
        },
        onSuccess: () => {
            toast.success('Orders deleted successfully');
            setSelectedOrders([]);
            queryClient.invalidateQueries(['orders']);
        }
    });

    // Bulk archive mutation
    const bulkArchiveMutation = useMutation({
        mutationFn: async (orderIds) => {
            await Promise.all(orderIds.map(id =>
                api.put(`/orders/${id}`, { status: 'cancelled' })
            ));
        },
        onSuccess: () => {
            toast.success('Orders archived successfully');
            setSelectedOrders([]);
            queryClient.invalidateQueries(['orders']);
        }
    });

    // WebSocket for real-time updates
    useEffect(() => {
        const socket = window.io ? window.io('http://localhost:5000') : null;

        if (socket) {
            socket.on('order:updated', () => {
                queryClient.invalidateQueries(['orders']);
            });

            socket.on('order:created', () => {
                queryClient.invalidateQueries(['orders']);
            });

            return () => {
                socket.off('order:updated');
                socket.off('order:created');
                socket.disconnect();
            };
        }
    }, [queryClient]);

    const filteredOrders = ordersData?.filter(order =>
        order.id.toString().includes(searchTerm) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectOrder = (orderId) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleSelectAll = () => {
        if (selectedOrders.length === filteredOrders?.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders?.map(o => o.id) || []);
        }
    };

    const handleBulkDelete = () => {
        if (!confirm(`Delete ${selectedOrders.length} order(s)?`)) return;
        bulkDeleteMutation.mutate(selectedOrders);
    };

    const handleBulkArchive = () => {
        if (!confirm(`Archive ${selectedOrders.length} order(s)?`)) return;
        bulkArchiveMutation.mutate(selectedOrders);
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setActiveTab('products');
        setShowDetailModal(true);
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: { bg: '#95959520', color: '#959595' },
            confirmed: { bg: '#F4A26120', color: '#F4A261' },
            preparing: { bg: '#2D5F5D20', color: '#2D5F5D' },
            ready: { bg: '#52B78820', color: '#52B788' },
            completed: { bg: '#52B78820', color: '#52B788' },
            cancelled: { bg: '#D6282820', color: '#D62828' }
        };
        const style = styles[status] || styles.draft;
        return (
            <span
                className="status-badge"
                style={{ background: style.bg, color: style.color }}
            >
                {status}
            </span>
        );
    };

    return (
        <div className="orders-page">
            <div className="page-header">
                <div>
                    <h1>Order Management</h1>
                    <p>View and manage all orders</p>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="orders-toolbar">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search by order # or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <Filter size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {selectedOrders.length > 0 && (
                    <div className="bulk-actions">
                        <span>{selectedOrders.length} selected</span>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleBulkArchive}
                        >
                            <Archive size={16} />
                            Archive
                        </button>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleBulkDelete}
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Orders Table */}
            {isLoading ? (
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading orders...</p>
                </div>
            ) : filteredOrders && filteredOrders.length > 0 ? (
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === filteredOrders.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Order #</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => handleSelectOrder(order.id)}
                                        />
                                    </td>
                                    <td className="order-number">#{order.id}</td>
                                    <td>{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</td>
                                    <td>{order.customer_name || 'Walk-in'}</td>
                                    <td>
                                        <span className="order-type-badge">{order.order_type}</span>
                                    </td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td className="order-total">₹{order.total_amount?.toFixed(2) || '0.00'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn view"
                                                onClick={() => handleViewDetails(order)}
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {order.status === 'draft' && (
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => deleteMutation.mutate(order.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <Package size={48} />
                    <p>No orders found</p>
                    <span>Orders will appear here once created</span>
                </div>
            )}

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedOrder(null);
                    }}
                />
            )}
        </div>
    );
};

// Order Detail Modal Component
const OrderDetailModal = ({ order, activeTab, setActiveTab, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Order #{order.id}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Order Info */}
                <div className="order-info-grid">
                    <div className="info-item">
                        <Calendar size={18} />
                        <div>
                            <span className="info-label">Date</span>
                            <span className="info-value">
                                {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                        </div>
                    </div>
                    <div className="info-item">
                        <User size={18} />
                        <div>
                            <span className="info-label">Customer</span>
                            <span className="info-value">{order.customer_name || 'Walk-in'}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <Package size={18} />
                        <div>
                            <span className="info-label">Type</span>
                            <span className="info-value">{order.order_type}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <DollarSign size={18} />
                        <div>
                            <span className="info-label">Total</span>
                            <span className="info-value">₹{order.total_amount?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'extra' ? 'active' : ''}`}
                        onClick={() => setActiveTab('extra')}
                    >
                        Extra Info
                    </button>
                </div>

                <div className="modal-body">
                    {activeTab === 'products' ? (
                        <div className="products-tab">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.product_name}</td>
                                            <td>{item.quantity}</td>
                                            <td>₹{item.price?.toFixed(2)}</td>
                                            <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="extra-tab">
                            <div className="info-section">
                                <h4>Order Details</h4>
                                <div className="detail-row">
                                    <span>Status:</span>
                                    <span>{order.status}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Session ID:</span>
                                    <span>{order.session_id || 'N/A'}</span>
                                </div>
                                {order.table_name && (
                                    <div className="detail-row">
                                        <span>Table:</span>
                                        <span>{order.table_name}</span>
                                    </div>
                                )}
                                {order.notes && (
                                    <div className="detail-row">
                                        <span>Notes:</span>
                                        <span>{order.notes}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
