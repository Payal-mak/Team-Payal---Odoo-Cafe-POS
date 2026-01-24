import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import Header from '../components/Header';
import '../styles/kitchen.css';

const Kitchen = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Fetch kitchen orders
    const fetchKitchenOrders = async () => {
        try {
            const response = await orderAPI.getAll({ kitchen_stage: 'preparing', limit: 100 });
            setOrders(response.data.data || []);
            setLastUpdate(new Date());
            setLoading(false);
        } catch (error) {
            console.error('Error fetching kitchen orders:', error);
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchKitchenOrders();

        // Poll every 5 seconds for new orders
        const interval = setInterval(fetchKitchenOrders, 5000);

        return () => clearInterval(interval);
    }, []);

    // Calculate elapsed time since order creation
    const getElapsedTime = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMinutes = Math.floor((now - created) / 1000 / 60);
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes === 1) return '1 min ago';
        if (diffMinutes < 60) return `${diffMinutes} mins ago`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours}h ${diffMinutes % 60}m ago`;
    };

    // Format time
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="kitchen-container">
                <Header 
                    title="🍳 Kitchen Display"
                    showBack={true}
                    backTo="/dashboard"
                />
                <div className="loading-state">Loading orders...</div>
            </div>
        );
    }

    return (
        <div className="kitchen-container">
            <Header 
                title="🍳 Kitchen Display"
                showBack={true}
                backTo="/dashboard"
            />

            <div className="kitchen-header-info">
                <div className="order-count">
                    📋 {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} in Queue
                </div>
                <div className="refresh-info">
                    <div className="refresh-indicator"></div>
                    <span>Auto-refresh • Last update: {formatTime(lastUpdate)}</span>
                </div>
            </div>

            <div className="kitchen-main">
                {orders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🍽️</div>
                        <h2>No Orders in Kitchen</h2>
                        <p>Orders sent from POS will appear here</p>
                    </div>
                ) : (
                    <div className="orders-grid">
                        {orders.map(order => (
                            <div key={order.id} className="order-card">
                                <div className="order-card-header">
                                    <div className="order-info-section">
                                        <div className="order-number">{order.order_number}</div>
                                        <div className="order-table">
                                            🪑 Table {order.table_number} 
                                            {order.floor_name && <span>• {order.floor_name}</span>}
                                        </div>
                                    </div>
                                    <div className="order-time">
                                        <div className="time-badge">{formatTime(order.created_at)}</div>
                                        <div className="elapsed-time">{getElapsedTime(order.created_at)}</div>
                                    </div>
                                </div>

                                <div className="order-items-section">
                                    <KitchenOrderItems orderId={order.id} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Separate component to fetch and display order items
const KitchenOrderItems = ({ orderId }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await orderAPI.getById(orderId);
                setItems(response.data.data.lines || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching order items:', error);
                setLoading(false);
            }
        };

        fetchItems();
    }, [orderId]);

    if (loading) {
        return <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading items...</div>;
    }

    return (
        <ul className="order-items">
            {items.map(item => (
                <li key={item.id} className="order-item">
                    <div className="item-info">
                        <div className="item-quantity">{item.quantity}×</div>
                        <div>
                            <div className="item-name">{item.product_name}</div>
                            {item.category_name && (
                                <span className="item-category">{item.category_name}</span>
                            )}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default Kitchen;
