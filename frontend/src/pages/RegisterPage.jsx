import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    User,
    Send,
    CreditCard,
    X,
    Search
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import './RegisterPage.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { cart, addItem, updateQuantity, removeItem, clearCart, subtotal, tax, total, setCustomer, customer } = useCart();
    const [activeTab, setActiveTab] = useState('register');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [notes, setNotes] = useState('');

    // Fetch products
    const { data: productsData } = useQuery({
        queryKey: ['products', selectedCategory],
        queryFn: async () => {
            const url = selectedCategory
                ? `/products?category_id=${selectedCategory}&is_active=true`
                : '/products?is_active=true';
            const response = await api.get(url);
            return response.data.data;
        }
    });

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data.data;
        }
    });

    // Fetch customers
    const { data: customersData } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const response = await api.get('/customers');
            return response.data.data;
        }
    });

    // Filter products by search
    const filteredProducts = productsData?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddToCart = (product) => {
        addItem({
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
        toast.success(`${product.name} added to cart`);
    };

    const handleSendToKitchen = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        try {
            const orderData = {
                customer_id: customer?.id || null,
                order_type: 'dine_in',
                notes: notes,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            await api.post('/orders', orderData);
            toast.success('Order sent to kitchen!');
            clearCart();
            setNotes('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send order');
        }
    };

    const handlePayment = () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        setShowPaymentModal(true);
    };

    return (
        <Layout>
            <div className="register-page">
                {/* Tabs */}
                <div className="register-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                        onClick={() => setActiveTab('table')}
                    >
                        Table
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => setActiveTab('register')}
                    >
                        Register
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Orders
                    </button>
                </div>

                <div className="register-content">
                    {/* Left Side - Products */}
                    <div className="products-section">
                        {/* Search */}
                        <div className="search-box">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Category Filters */}
                        <div className="category-filters">
                            <button
                                className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('')}
                            >
                                All
                            </button>
                            {categoriesData?.map(category => (
                                <button
                                    key={category.id}
                                    className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(category.id)}
                                    style={{
                                        borderColor: selectedCategory === category.id ? category.color : 'transparent',
                                        color: selectedCategory === category.id ? category.color : 'inherit'
                                    }}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        {/* Products Grid */}
                        <div className="products-grid">
                            {filteredProducts?.map(product => (
                                <div
                                    key={product.id}
                                    className="product-item"
                                    onClick={() => handleAddToCart(product)}
                                >
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} />
                                    ) : (
                                        <div className="no-image">
                                            <ShoppingCart size={24} />
                                        </div>
                                    )}
                                    <div className="product-details">
                                        <h4>{product.name}</h4>
                                        <p className="product-price">₹{Number(product.price || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side - Cart */}
                    <div className="cart-section">
                        <div className="cart-header">
                            <h3>Current Order</h3>
                            <ShoppingCart size={20} />
                        </div>

                        {/* Customer Selection */}
                        <div className="customer-select">
                            <User size={18} />
                            <select
                                value={customer?.id || ''}
                                onChange={(e) => {
                                    const selectedCustomer = customersData?.find(c => c.id === parseInt(e.target.value));
                                    setCustomer(selectedCustomer || null);
                                }}
                            >
                                <option value="">Walk-in Customer</option>
                                {customersData?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Cart Items */}
                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <ShoppingCart size={48} />
                                    <p>Cart is empty</p>
                                    <span>Add items to get started</span>
                                </div>
                            ) : (
                                cart.map((item, index) => (
                                    <div key={index} className="cart-item">
                                        <div className="item-info">
                                            <h4>{item.name}</h4>
                                            <p>₹{item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="item-controls">
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="quantity">{item.quantity}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => removeItem(index)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="item-total">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Notes */}
                        <div className="order-notes">
                            <textarea
                                placeholder="Add notes for kitchen..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="2"
                            />
                        </div>

                        {/* Totals */}
                        <div className="cart-totals">
                            <div className="total-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Tax (5%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="cart-actions">
                            <button
                                className="btn btn-secondary btn-block"
                                onClick={handleSendToKitchen}
                                disabled={cart.length === 0}
                            >
                                <Send size={18} />
                                Send to Kitchen
                            </button>
                            <button
                                className="btn btn-primary btn-block"
                                onClick={handlePayment}
                                disabled={cart.length === 0}
                            >
                                <CreditCard size={18} />
                                Payment
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payment Modal */}
                {showPaymentModal && (
                    <PaymentModal
                        total={total}
                        cart={cart}
                        customer={customer}
                        notes={notes}
                        onClose={() => setShowPaymentModal(false)}
                        onSuccess={() => {
                            clearCart();
                            setNotes('');
                            setShowPaymentModal(false);
                            toast.success('Payment completed successfully!');
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

export default RegisterPage;
