import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tableAPI, sessionAPI, productAPI, orderAPI } from '../services/api';
import Header from '../components/Header';
import PaymentModal from '../components/PaymentModal';
import '../styles/order-view.css';

const OrderView = () => {
    const navigate = useNavigate();
    const { tableId } = useParams();
    const location = useLocation();
    const { user } = useAuth();

    const [table, setTable] = useState(location.state?.table || null);
    const [floor, setFloor] = useState(location.state?.floor || null);
    const [session, setSession] = useState(location.state?.session || null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, [tableId]);

    const loadData = async () => {
        try {
            // Load table if not in state
            let tableData = location.state?.table;
            if (!tableData) {
                const tableRes = await tableAPI.getById(tableId);
                tableData = tableRes.data.data;
                setTable(tableData);
            }

            // Load session if not in state
            let sessionData = location.state?.session;
            if (!sessionData) {
                const sessionRes = await sessionAPI.getCurrent(user?.id);
                if (!sessionRes.data.data) {
                    navigate('/dashboard');
                    return;
                }
                sessionData = sessionRes.data.data;
                setSession(sessionData);
            }

            // Load products
            const productsRes = await productAPI.getAll();
            setProducts(productsRes.data.data || []);

            // Extract unique categories
            const cats = [...new Set((productsRes.data.data || []).map(p => p.category_name).filter(Boolean))];
            setCategories(cats);

            setLoading(false);
        } catch (error) {
            console.error('Error loading order data:', error);
            navigate('/pos');
        }
    };

    const handleBackToTables = () => {
        navigate('/pos');
    };

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        setOrderSuccess(null); // Clear success message when cart changes
    };

    const updateQuantity = (productId, delta) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.id === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(Boolean);
        });
        setOrderSuccess(null);
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
        setOrderSuccess(null);
    };

    const clearCart = () => {
        setCart([]);
        setOrderSuccess(null);
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * 0.1; // 10% tax
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const handleConfirmOrder = async () => {
        if (cart.length === 0) return;

        setSaving(true);
        setOrderSuccess(null);

        try {
            const orderData = {
                table_id: parseInt(tableId),
                session_id: session?.id,
                items: cart.map(item => ({
                    id: item.id,
                    price: parseFloat(item.price),
                    quantity: item.quantity,
                    tax_rate: item.tax_rate || 10
                })),
                notes: null
            };

            const response = await orderAPI.create(orderData);

            if (response.data.success) {
                setCurrentOrder(response.data.data);
                setOrderSuccess({
                    message: 'Order confirmed!',
                    orderNumber: response.data.data.order_number
                });
                // Don't clear cart - user might want to add more items
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert(error.response?.data?.message || 'Failed to save order');
        } finally {
            setSaving(false);
        }
    };

    const handleSendToKitchen = async () => {
        if (!currentOrder && cart.length === 0) return;

        setSaving(true);

        try {
            let orderId = currentOrder?.id;

            // If no current order, create one first
            if (!orderId) {
                const orderData = {
                    table_id: parseInt(tableId),
                    session_id: session?.id,
                    items: cart.map(item => ({
                        id: item.id,
                        price: parseFloat(item.price),
                        quantity: item.quantity,
                        tax_rate: item.tax_rate || 10
                    })),
                    notes: null
                };

                const response = await orderAPI.create(orderData);
                orderId = response.data.data.id;
                setCurrentOrder(response.data.data);
            }

            // Send to kitchen
            const kitchenResponse = await orderAPI.sendToKitchen(orderId);

            if (kitchenResponse.data.success) {
                setOrderSuccess({
                    message: 'Order sent to kitchen!',
                    orderNumber: kitchenResponse.data.data.order_number
                });
                setCart([]); // Clear cart after sending to kitchen
                setCurrentOrder(kitchenResponse.data.data);
            }
        } catch (error) {
            console.error('Error sending to kitchen:', error);
            alert(error.response?.data?.message || 'Failed to send order to kitchen');
        } finally {
            setSaving(false);
        }
    };

    const filteredProducts = selectedCategory === 'all'
        ? products
        : products.filter(p => p.category_name === selectedCategory);

    const formatCurrency = (amount) => {
        return `$${(parseFloat(amount) || 0).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="order-container">
                <div className="loading-state">Loading order view...</div>
            </div>
        );
    }

    return (
        <div className="order-container">
            <Header 
                title={`Table ${table?.number}`}
                subtitle={floor?.name || table?.floor_name}
                showBack={true}
                backTo="/pos"
                backLabel="← Tables"
            >
                <span className="session-badge">
                    🟢 {session?.pos_name}
                </span>
            </Header>

            <div className="order-main">
                {/* Products Section */}
                <div className="products-section">
                    {/* Category Tabs */}
                    <div className="category-tabs">
                        <button
                            className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    <div className="product-grid">
                        {filteredProducts.length === 0 ? (
                            <div className="empty-products">
                                <span className="empty-icon">📦</span>
                                <p>No products available</p>
                            </div>
                        ) : (
                            filteredProducts.map(product => {
                                // Default to available if the field doesn't exist
                                const isAvailable = product.available !== false && product.available !== 0;
                                return (
                                    <div
                                        key={product.id}
                                        className={`product-card ${!isAvailable ? 'unavailable' : ''}`}
                                        onClick={() => isAvailable && addToCart(product)}
                                    >
                                        <div className="product-emoji">
                                            {product.category_name === 'Pizza' ? '🍕' :
                                                product.category_name === 'Pasta' ? '🍝' :
                                                    product.category_name === 'Burgers' ? '🍔' :
                                                        product.category_name === 'Beverages' ? '☕' :
                                                            product.category_name === 'Desserts' ? '🍰' : '🍽️'}
                                        </div>
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-price">{formatCurrency(product.price)}</div>
                                        {!isAvailable && (
                                            <span className="unavailable-badge">Unavailable</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Cart Section */}
                <div className="cart-section">
                    <div className="cart-header">
                        <h2>🛒 Order Summary</h2>
                        {cart.length > 0 && (
                            <button className="clear-cart-btn" onClick={clearCart}>
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Success Message */}
                    {orderSuccess && (
                        <div className="order-success">
                            <span className="success-icon">✅</span>
                            <div>
                                <strong>{orderSuccess.message}</strong>
                                <span className="order-number">{orderSuccess.orderNumber}</span>
                            </div>
                        </div>
                    )}

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <span className="empty-icon">📝</span>
                                <p>No items in order</p>
                                <span className="hint">Select products to add to order</span>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-info">
                                        <span className="cart-item-name">{item.name}</span>
                                        <span className="cart-item-price">
                                            {formatCurrency(item.price)} × {item.quantity}
                                        </span>
                                    </div>
                                    <div className="cart-item-controls">
                                        <button
                                            className="qty-btn"
                                            onClick={() => updateQuantity(item.id, -1)}
                                        >
                                            −
                                        </button>
                                        <span className="qty-value">{item.quantity}</span>
                                        <button
                                            className="qty-btn"
                                            onClick={() => updateQuantity(item.id, 1)}
                                        >
                                            +
                                        </button>
                                        <button
                                            className="remove-btn"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="cart-item-total">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="cart-totals">
                            <div className="total-row">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(calculateSubtotal())}</span>
                            </div>
                            <div className="total-row">
                                <span>Tax (10%):</span>
                                <span>{formatCurrency(calculateTax())}</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total:</span>
                                <span>{formatCurrency(calculateTotal())}</span>
                            </div>
                        </div>
                    )}

                    <div className="cart-footer">
                        <div className="cart-actions">
                            <button
                                className="btn-secondary"
                                disabled={cart.length === 0 || saving}
                                onClick={handleSendToKitchen}
                            >
                                {saving ? '⏳ Sending...' : '🍳 Send to Kitchen'}
                            </button>
                            <button
                                className="btn-primary"
                                disabled={!currentOrder || saving}
                                onClick={() => setIsPaymentModalOpen(true)}
                            >
                                💳 Pay {currentOrder ? formatCurrency(currentOrder.total_amount) : ''}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {currentOrder && (
                <PaymentModal 
                    order={currentOrder}
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onPaymentSuccess={(paidOrder) => {
                        setCurrentOrder(paidOrder);
                        setCart([]);
                        setOrderSuccess({
                            message: 'Payment successful!',
                            orderNumber: paidOrder.order_number
                        });
                        // Navigate back to POS after a moment
                        setTimeout(() => {
                            navigate('/pos');
                        }, 2000);
                    }}
                />
            )}
        </div>
    );
};

export default OrderView;
