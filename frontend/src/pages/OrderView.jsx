import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tableAPI, sessionAPI, productAPI } from '../services/api';
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

    useEffect(() => {
        loadData();
    }, [tableId]);

    const loadData = async () => {
        try {
            // Load table if not in state
            if (!location.state?.table) {
                const tableRes = await tableAPI.getById(tableId);
                setTable(tableRes.data.data);
            }

            // Load session if not in state
            if (!location.state?.session) {
                const sessionRes = await sessionAPI.getCurrent(user?.id);
                if (!sessionRes.data.data) {
                    navigate('/dashboard');
                    return;
                }
                setSession(sessionRes.data.data);
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
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
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
            {/* Order Header */}
            <header className="order-header">
                <div className="order-header-left">
                    <button className="back-btn" onClick={handleBackToTables}>
                        ← Tables
                    </button>
                    <div className="order-info">
                        <h1>Table {table?.number}</h1>
                        <span className="floor-name">{floor?.name || table?.floor_name}</span>
                    </div>
                </div>
                <div className="order-header-right">
                    <span className="session-badge">
                        🟢 {session?.pos_name}
                    </span>
                </div>
            </header>

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
                                disabled={cart.length === 0}
                            >
                                🍳 Send to Kitchen
                            </button>
                            <button
                                className="btn-primary"
                                disabled={cart.length === 0}
                            >
                                💳 Pay {cart.length > 0 ? formatCurrency(calculateTotal()) : ''}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderView;
