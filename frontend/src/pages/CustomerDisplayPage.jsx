import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import './CustomerDisplayPage.css';

const CustomerDisplayPage = () => {
    const { socket } = useSocket();
    const [currentOrder, setCurrentOrder] = useState(null);

    // Fetch latest order (could be from a specific table/session)
    const { data: ordersData } = useQuery({
        queryKey: ['latest-order'],
        queryFn: async () => {
            const response = await api.get('/orders?limit=1&status=draft');
            return response.data.data;
        },
        refetchInterval: 5000, // Refresh every 5 seconds
    });

    useEffect(() => {
        if (ordersData && ordersData.length > 0) {
            setCurrentOrder(ordersData[0]);
        }
    }, [ordersData]);

    // Listen for real-time order updates
    useEffect(() => {
        if (!socket) return;

        socket.on('order:created', (order) => {
            setCurrentOrder(order);
        });

        socket.on('order:updated', (order) => {
            if (currentOrder && order.id === currentOrder.id) {
                setCurrentOrder(order);
            }
        });

        return () => {
            socket.off('order:created');
            socket.off('order:updated');
        };
    }, [socket, currentOrder]);

    const calculateSubtotal = () => {
        if (!currentOrder || !currentOrder.items) return 0;
        return currentOrder.items.reduce((sum, item) => {
            return sum + (Number(item.price) * item.quantity);
        }, 0);
    };

    const calculateTax = () => {
        const subtotal = calculateSubtotal();
        return subtotal * 0.05; // 5% tax
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    return (
        <div className="customer-display">
            <div className="customer-display-container">
                {/* Left Side - Fixed Message */}
                <div className="customer-display-left">
                    <div className="welcome-section">
                        <h1>Welcome to</h1>
                        <h2>Odoo Cafe</h2>
                        <p className="tagline">Brewing Excellence, Serving Smiles</p>
                    </div>

                    <div className="info-section">
                        <div className="info-item">
                            <span className="info-icon">☕</span>
                            <span>Fresh Coffee Daily</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">🍰</span>
                            <span>Homemade Pastries</span>
                        </div>
                        <div className="info-item">
                            <span className="info-icon">📶</span>
                            <span>Free WiFi</span>
                        </div>
                    </div>

                    <div className="promo-section">
                        <h3>Today's Special</h3>
                        <p>Buy 2 Get 1 Free on all beverages!</p>
                    </div>
                </div>

                {/* Right Side - Dynamic Order View */}
                <div className="customer-display-right">
                    {currentOrder && currentOrder.items && currentOrder.items.length > 0 ? (
                        <>
                            <div className="order-header">
                                <h2>Your Order</h2>
                                <span className="order-number">Order #{currentOrder.order_number || currentOrder.id}</span>
                            </div>

                            <div className="order-items">
                                {currentOrder.items.map((item, index) => (
                                    <div key={index} className="order-item">
                                        {item.image_url && (
                                            <div className="item-image">
                                                <img src={item.image_url} alt={item.product_name} />
                                            </div>
                                        )}
                                        <div className="item-details">
                                            <h3>{item.product_name}</h3>
                                            <p className="item-quantity">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="item-price">
                                            ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="order-summary">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Tax (5%)</span>
                                    <span>₹{calculateTax().toFixed(2)}</span>
                                </div>
                                <div className="summary-row total">
                                    <span>Grand Total</span>
                                    <span>₹{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="order-status">
                                <div className="status-indicator">
                                    <div className="pulse"></div>
                                    <span>Processing your order...</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-order">
                            <div className="empty-icon">🛒</div>
                            <h2>No Active Order</h2>
                            <p>Your order will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDisplayPage;
