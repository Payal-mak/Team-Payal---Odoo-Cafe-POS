import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import Header from '../components/Header';
import '../styles/kitchen.css';

const Kitchen = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState({ to_cook: [], preparing: [], completed: [] });
    const [selectedStage, setSelectedStage] = useState('to_cook');
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Fetch kitchen orders for all stages
    const fetchKitchenOrders = async () => {
        try {
            // Fetch orders for all stages
            const [toCookRes, preparingRes, completedRes] = await Promise.all([
                orderAPI.getAll({ kitchen_stage: 'to_cook', limit: 100 }),
                orderAPI.getAll({ kitchen_stage: 'preparing', limit: 100 }),
                orderAPI.getAll({ kitchen_stage: 'completed', limit: 100 })
            ]);

            setOrders({
                to_cook: toCookRes.data.data || [],
                preparing: preparingRes.data.data || [],
                completed: completedRes.data.data || []
            });
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

    // Handle stage advancement
    const handleAdvanceStage = async (orderId, currentStage) => {
        try {
            let nextStage;
            if (currentStage === 'to_cook') nextStage = 'preparing';
            else if (currentStage === 'preparing') nextStage = 'completed';
            else return;

            await orderAPI.updateKitchenStage(orderId, nextStage);
            fetchKitchenOrders(); // Refresh
        } catch (error) {
            console.error('Error advancing stage:', error);
            alert('Failed to update order stage');
        }
    };

    const currentOrders = orders[selectedStage] || [];
    const totalOrders = orders.to_cook.length + orders.preparing.length + orders.completed.length;

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
                    📋 {totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'} Total
                </div>
                <div className="refresh-info">
                    <div className="refresh-indicator"></div>
                    <span>Auto-refresh • Last update: {formatTime(lastUpdate)}</span>
                </div>
            </div>

            {/* Stage Tabs */}
            <div className="kitchen-stage-tabs">
                <button
                    className={`stage-tab ${selectedStage === 'to_cook' ? 'active' : ''}`}
                    onClick={() => setSelectedStage('to_cook')}
                >
                    🆕 To Cook ({orders.to_cook.length})
                </button>
                <button
                    className={`stage-tab ${selectedStage === 'preparing' ? 'active' : ''}`}
                    onClick={() => setSelectedStage('preparing')}
                >
                    👨‍🍳 Preparing ({orders.preparing.length})
                </button>
                <button
                    className={`stage-tab ${selectedStage === 'completed' ? 'active' : ''}`}
                    onClick={() => setSelectedStage('completed')}
                >
                    ✅ Completed ({orders.completed.length})
                </button>
            </div>

            <div className="kitchen-main">
                {currentOrders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🍽️</div>
                        <h2>No Orders in {selectedStage === 'to_cook' ? 'Queue' : selectedStage === 'preparing' ? 'Preparation' : 'Completed'}</h2>
                        <p>Orders will appear here when {selectedStage === 'to_cook' ? 'sent from POS' : selectedStage === 'preparing' ? 'being prepared' : 'ready'}</p>
                    </div>
                ) : (
                    <div className="orders-grid">
                        {currentOrders.map(order => (
                            <div 
                                key={order.id} 
                                className={`order-card ${selectedStage === 'completed' ? 'completed' : ''}`}
                                onClick={() => {
                                    if (selectedStage !== 'completed') {
                                        handleAdvanceStage(order.id, selectedStage);
                                    }
                                }}
                            >
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
                                    <KitchenOrderItems 
                                        orderId={order.id} 
                                        stage={selectedStage}
                                        onItemPrepared={() => fetchKitchenOrders()}
                                    />
                                </div>

                                {selectedStage !== 'completed' && (
                                    <div className="order-action-hint">
                                        Click to move to {selectedStage === 'to_cook' ? 'Preparing' : 'Completed'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Separate component to fetch and display order items
const KitchenOrderItems = ({ orderId, stage, onItemPrepared }) => {
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
        // Refresh items periodically
        const interval = setInterval(fetchItems, 3000);
        return () => clearInterval(interval);
    }, [orderId]);

    const handleItemClick = async (e, item) => {
        e.stopPropagation(); // Prevent order card click
        if (item.is_prepared) return; // Already prepared

        try {
            await orderAPI.markItemPrepared(orderId, item.id);
            // Refresh items
            const response = await orderAPI.getById(orderId);
            setItems(response.data.data.lines || []);
            if (onItemPrepared) onItemPrepared();
        } catch (error) {
            console.error('Error marking item prepared:', error);
            alert('Failed to mark item as prepared');
        }
    };

    if (loading) {
        return <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading items...</div>;
    }

    return (
        <ul className="order-items">
            {items.map(item => (
                <li 
                    key={item.id} 
                    className={`order-item ${item.is_prepared ? 'prepared' : ''}`}
                    onClick={(e) => stage !== 'completed' && handleItemClick(e, item)}
                    style={{ cursor: stage !== 'completed' && !item.is_prepared ? 'pointer' : 'default' }}
                >
                    <div className="item-info">
                        <div className="item-quantity">{item.quantity}×</div>
                        <div>
                            <div className={`item-name ${item.is_prepared ? 'strikethrough' : ''}`}>
                                {item.product_name}
                            </div>
                            {item.category_name && (
                                <span className="item-category">{item.category_name}</span>
                            )}
                        </div>
                    </div>
                    {item.is_prepared && (
                        <span className="prepared-badge">✓</span>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default Kitchen;
