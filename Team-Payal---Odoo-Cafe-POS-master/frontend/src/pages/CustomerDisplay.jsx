import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import '../styles/customer-display.css';

const CustomerDisplay = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
            // Poll for updates every 2 seconds
            const interval = setInterval(fetchOrder, 2000);
            return () => clearInterval(interval);
        }
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const response = await orderAPI.getById(orderId);
            setOrder(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching order:', error);
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return `$${(parseFloat(amount) || 0).toFixed(2)}`;
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="customer-display-container">
                <div className="loading-state">Loading order information...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="customer-display-container">
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h2>Order Not Found</h2>
                    <p>Please check the order number</p>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-display-container">
            <div className="customer-display-header">
                <div className="display-logo">🍽️ Odoo Cafe</div>
                <div className="display-order-number">Order #{order.order_number}</div>
            </div>

            <div className="customer-display-main">
                {/* Order Info */}
                <div className="order-info-section">
                    <div className="info-row">
                        <span className="info-label">Table:</span>
                        <span className="info-value">Table {order.table_number}</span>
                    </div>
                    {order.floor_name && (
                        <div className="info-row">
                            <span className="info-label">Floor:</span>
                            <span className="info-value">{order.floor_name}</span>
                        </div>
                    )}
                    <div className="info-row">
                        <span className="info-label">Time:</span>
                        <span className="info-value">{formatTime(order.created_at)}</span>
                    </div>
                </div>

                {/* Order Items */}
                <div className="order-items-section">
                    <h3 className="section-title">Your Order</h3>
                    <div className="items-list">
                        {order.lines && order.lines.length > 0 ? (
                            order.lines.map(item => (
                                <div key={item.id} className="order-item-row">
                                    <div className="item-quantity">{item.quantity}×</div>
                                    <div className="item-details">
                                        <div className="item-name">{item.product_name}</div>
                                        {item.category_name && (
                                            <div className="item-category">{item.category_name}</div>
                                        )}
                                    </div>
                                    <div className="item-price">
                                        {formatCurrency(item.total)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-items">No items in order</div>
                        )}
                    </div>
                </div>

                {/* Totals */}
                <div className="order-totals-section">
                    <div className="total-row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(order.total_amount - order.tax_amount)}</span>
                    </div>
                    <div className="total-row">
                        <span>Tax:</span>
                        <span>{formatCurrency(order.tax_amount)}</span>
                    </div>
                    <div className="total-row grand-total">
                        <span>Total:</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                </div>

                {/* Payment Status */}
                <div className={`payment-status-section ${order.payment_status}`}>
                    <div className="status-icon">
                        {order.payment_status === 'paid' ? '✅' : '⏳'}
                    </div>
                    <div className="status-text">
                        <div className="status-label">Payment Status</div>
                        <div className="status-value">
                            {order.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                        </div>
                    </div>
                </div>

                {/* Kitchen Status */}
                {order.kitchen_stage && (
                    <div className="kitchen-status-section">
                        <div className="status-label">Order Status</div>
                        <div className={`kitchen-status-badge ${order.kitchen_stage}`}>
                            {order.kitchen_stage === 'to_cook' && '🆕 To Cook'}
                            {order.kitchen_stage === 'preparing' && '👨‍🍳 Preparing'}
                            {order.kitchen_stage === 'completed' && '✅ Ready'}
                        </div>
                    </div>
                )}
            </div>

            <div className="customer-display-footer">
                <div className="footer-text">Thank you for your order!</div>
            </div>
        </div>
    );
};

export default CustomerDisplay;
