import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, Send, CreditCard, ChevronLeft } from 'lucide-react';
import PaymentModal from '../PaymentModal';
import './POSRegisterTab.css';

const POSRegisterTab = ({ sessionId }) => {
    const queryClient = useQueryClient();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [cartItems, setCartItems] = useState([]);
    const [selectedCartItemIdx, setSelectedCartItemIdx] = useState(null);
    const [numpadMode, setNumpadMode] = useState('Qty'); // Qty, Disc, Price
    const [customerName, setCustomerName] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [selectedTable, setSelectedTable] = useState(null);

    useEffect(() => {
        const tableData = sessionStorage.getItem('selectedTable');
        if (tableData) {
            setSelectedTable(JSON.parse(tableData));
        }
    }, []);

    // Fetch products
    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/products?is_active=true');
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

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!productsData) return [];
        let filtered = productsData;

        if (selectedCategory) {
            filtered = filtered.filter(p => String(p.category_id) === String(selectedCategory));
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
        }

        return filtered;
    }, [productsData, selectedCategory, searchTerm]);

    const handleProductClick = (product) => {
        setCartItems(prev => {
            const existingIdx = prev.findIndex(item => item.product.id === product.id);
            if (existingIdx >= 0) {
                // Increment Qty
                const newCart = [...prev];
                newCart[existingIdx] = {
                    ...newCart[existingIdx],
                    qty: newCart[existingIdx].qty + 1
                };
                setSelectedCartItemIdx(existingIdx);
                return newCart;
            } else {
                // Add new
                const safePrice = parseFloat(product.price) || 0;
                const newItem = {
                    product,
                    qty: 1,
                    notes: '',
                    discount: 0,
                    price: isNaN(safePrice) ? 0 : safePrice
                };
                setSelectedCartItemIdx(prev.length);
                return [...prev, newItem];
            }
        });
    };

    const handleNumpad = (value) => {
        if (selectedCartItemIdx === null || cartItems.length === 0) return;

        setCartItems(prev => {
            const newCart = [...prev];
            const item = newCart[selectedCartItemIdx];

            if (value === 'Backspace') {
                if (numpadMode === 'Qty') {
                    const strQty = String(item.qty).slice(0, -1);
                    item.qty = strQty ? parseInt(strQty, 10) : 0;
                    if (item.qty === 0) {
                        newCart.splice(selectedCartItemIdx, 1);
                        setSelectedCartItemIdx(newCart.length > 0 ? newCart.length - 1 : null);
                    }
                } else if (numpadMode === 'Disc') {
                    const strDisc = String(item.discount).slice(0, -1);
                    item.discount = strDisc ? parseFloat(strDisc) : 0;
                } else if (numpadMode === 'Price') {
                    const strPrice = String(item.price).slice(0, -1);
                    item.price = strPrice ? parseFloat(strPrice) : 0;
                }
                return newCart;
            }

            if (value === '+/-') {
                if (numpadMode === 'Qty') item.qty = item.qty * -1;
                return newCart;
            }

            // Append digit
            if (numpadMode === 'Qty') {
                item.qty = item.qty === 0 ? parseInt(value, 10) : parseInt(String(item.qty) + value, 10);
            } else if (numpadMode === 'Disc') {
                item.discount = item.discount === 0 ? parseFloat(value) : parseFloat(String(item.discount) + value);
                if (item.discount > 100) item.discount = 100;
            } else if (numpadMode === 'Price') {
                item.price = item.price === 0 ? parseFloat(value) : parseFloat(String(item.price) + value);
            }
            return newCart;
        });
    };

    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.qty) || 0;
            const discount = parseFloat(item.discount) || 0;
            const itemTotal = qty * price;
            const discountAmt = itemTotal * (discount / 100);
            return sum + (itemTotal - discountAmt);
        }, 0);
    }, [cartItems]);

    const taxObj = 0; // Configurable
    const total = subtotal + taxObj;

    const handleSendOrder = async () => {
        if (cartItems.length === 0) return;

        if (!sessionId) {
            toast.error('No active session. Please open a session first.');
            return;
        }

        try {
            const payload = {
                session_id: sessionId,
                table_id: selectedTable?.id || null,
                order_type: selectedTable ? 'dine_in' : 'takeaway',
                notes: orderNotes || '',
                customer_name: customerName || '',
                items: cartItems.map(item => ({
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: Number(item.qty) || 1,
                    unit_price: parseFloat(item.price) || 0,
                    discount: parseFloat(item.discount) || 0,
                    notes: item.notes || ''
                }))
            };

            // Validate no NaN values exist before sending
            const hasNaN = payload.items.some(
                i => isNaN(i.quantity) || isNaN(i.unit_price) || isNaN(i.discount)
            );
            if (hasNaN) {
                toast.error('Invalid item values. Please check quantities and prices.');
                return;
            }

            await api.post('/orders', payload);
            toast.success('Order sent to kitchen! 🍳');
            setCartItems([]);
            setSelectedCartItemIdx(null);
            setOrderNotes('');
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['activeOrders']); // Floor Tab Sync
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send order');
        }
    };

    const handlePayment = () => {
        if (cartItems.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        setShowPaymentModal(true);
    };

    return (
        <div className="pos-register">
            {/* Left Box: Categories & Products */}
            <div className="pos-products-area">
                <div className="pos-products-header">
                    <div className="pos-search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pos-categories-strip">
                    <button
                        className={`pos-cat-btn ${selectedCategory === '' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('')}
                    >
                        All
                    </button>
                    {categoriesData?.map(cat => (
                        <button
                            key={cat.id}
                            className={`pos-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                            style={{ borderColor: cat.color || 'transparent' }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="pos-products-grid">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="pos-product-card"
                            onClick={() => handleProductClick(product)}
                        >
                            <div className="pos-product-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} />
                                ) : (
                                    <ShoppingCart size={32} color="#ccc" />
                                )}
                            </div>
                            <div className="pos-product-info">
                                <h4>{product.name}</h4>
                                <span>₹{Number(product.price).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Box: Cart & Numpad */}
            <div className="pos-sidebar">
                <div className="pos-sidebar-header">
                    {selectedTable ? (
                        <div className="pos-table-badge">
                            Table {selectedTable.name} ({selectedTable.seats} Seats)
                        </div>
                    ) : (
                        <h3>Current Order</h3>
                    )}
                </div>

                <div className="pos-cart-items">
                    {cartItems.length === 0 ? (
                        <div className="pos-empty-cart">
                            <ShoppingCart size={48} />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cartItems.map((item, idx) => (
                            <div
                                key={idx}
                                className={`pos-cart-line ${selectedCartItemIdx === idx ? 'selected' : ''}`}
                                onClick={() => setSelectedCartItemIdx(idx)}
                            >
                                <div className="pos-cart-line-main">
                                    <span className="pos-cart-qty">{item.qty} Units</span>
                                    <span className="pos-cart-name">{item.product.name}</span>
                                    <span className="pos-cart-price">₹{Number(item.price * item.qty).toFixed(2)}</span>
                                </div>
                                {item.discount > 0 && (
                                    <div className="pos-cart-line-sub">Dicount: {item.discount}%</div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="pos-cart-customer">
                    <input
                        type="text"
                        placeholder="Customer Name (Optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Order Notes"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                    />
                </div>

                <div className="pos-numpad-container">
                    <div className="pos-numpad-modes">
                        <button className={numpadMode === 'Qty' ? 'active' : ''} onClick={() => setNumpadMode('Qty')}>Qty</button>
                        <button className={numpadMode === 'Disc' ? 'active' : ''} onClick={() => setNumpadMode('Disc')}>Disc</button>
                        <button className={numpadMode === 'Price' ? 'active' : ''} onClick={() => setNumpadMode('Price')}>Price</button>
                        <button onClick={() => handleNumpad('Backspace')} className="action-key"><ChevronLeft size={20} /></button>
                    </div>
                    <div className="pos-numpad-grid">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '+/-', '0', '.'].map(btn => (
                            <button key={btn} onClick={() => handleNumpad(btn)}>{btn}</button>
                        ))}
                    </div>
                </div>

                <div className="pos-cart-totals">
                    <div className="pos-total-row grand">
                        <span>Total:</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="pos-cart-actions">
                    <button className="pos-btn-send" onClick={handleSendOrder} disabled={cartItems.length === 0}>
                        <Send size={20} />
                        Send
                    </button>
                    <button className="pos-btn-pay" onClick={handlePayment} disabled={cartItems.length === 0}>
                        <CreditCard size={20} />
                        Payment
                    </button>
                </div>
            </div>

            {showPaymentModal && (
                <PaymentModal
                    total={total}
                    sessionId={sessionId}
                    tableId={selectedTable?.id}
                    cart={cartItems.map(c => ({
                        product_id: c.product.id,
                        name: c.product.name,
                        price: c.price,
                        quantity: c.qty
                    }))}
                    customer={{ name: customerName }}
                    notes={orderNotes}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        setCartItems([]);
                        setOrderNotes('');
                        setCustomerName('');
                        setShowPaymentModal(false);
                        queryClient.invalidateQueries(['orders']);
                        toast.success('Payment completed successfully!');
                    }}
                />
            )}
        </div>
    );
};

export default POSRegisterTab;
