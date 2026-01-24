import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inventoryAPI, orderAPI, sessionAPI } from '../services/api';

const POSOrder = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();

    // Data State
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // UI State
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

    // Cart State
    const [cart, setCart] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, prodRes, sessionRes] = await Promise.all([
                inventoryAPI.getCategories(),
                inventoryAPI.getProducts(),
                sessionAPI.active(1) // Assuming config ID 1 for now
            ]);

            const cats = catRes.data.data.categories;
            setCategories(cats);
            setProducts(prodRes.data.data.products);
            setActiveSession(sessionRes.data.data.session);

            if (cats.length > 0) {
                setActiveCategoryId(cats[0].id);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch POS data', err);
            // alert('Error loading POS data'); // Optional
            setLoading(false);
        }
    };

    // --- Cart Management ---
    const addToCart = (product, variant = null) => {
        const cartItemKey = variant
            ? `${product.id}-${variant.id}`
            : `${product.id}`;

        const existingItem = cart.find(item => item.key === cartItemKey);

        if (existingItem) {
            updateQuantity(cartItemKey, existingItem.quantity + 1);
        } else {
            const price = variant
                ? parseFloat(product.price) + parseFloat(variant.extra_price)
                : parseFloat(product.price);

            setCart([...cart, {
                key: cartItemKey,
                product,
                variant,
                quantity: 1,
                price: price,
                name: product.name + (variant ? ` (${variant.value})` : '')
            }]);
        }
    };

    const updateQuantity = (key, newQty) => {
        if (newQty <= 0) {
            setCart(cart.filter(item => item.key !== key));
        } else {
            setCart(cart.map(item =>
                item.key === key ? { ...item, quantity: newQty } : item
            ));
        }
    };

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Approximate tax calculation (using average rate if mixed, or simplified)
        // Ideally, sum tax per line based on product tax rate
        const tax = cart.reduce((sum, item) => {
            const taxRate = item.product.tax_rate || 0;
            return sum + ((item.price * item.quantity * taxRate) / 100);
        }, 0);

        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    };

    // --- Interaction Handlers ---
    const handleProductClick = (product) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedProductForVariant(product);
            setIsVariantModalOpen(true);
        } else {
            addToCart(product);
        }
    };

    const handleVariantSelect = (variant) => {
        addToCart(selectedProductForVariant, variant);
        setIsVariantModalOpen(false);
        setSelectedProductForVariant(null);
    };

    const handlePay = async () => {
        if (cart.length === 0) return;
        if (!activeSession) {
            alert('No active session found!');
            return;
        }

        const { total, tax } = calculateTotals();

        const orderPayload = {
            session_id: activeSession.id,
            table_id: tableId, // From URL
            total_amount: total.toFixed(2),
            tax_amount: tax.toFixed(2),
            payment_method: 'cash', // Default for now
            items: cart.map(item => ({
                product_id: item.product.id,
                variant_id: item.variant?.id,
                quantity: item.quantity,
                unit_price: item.price.toFixed(2),
                tax_rate: item.product.tax_rate,
                subtotal: (item.price * item.quantity).toFixed(2),
                total: (item.price * item.quantity * (1 + (item.product.tax_rate / 100))).toFixed(2)
            }))
        };

        try {
            await orderAPI.create(orderPayload);
            alert('Order Placed Successfully!');
            setCart([]);
            navigate('/pos/floors'); // Go back to floor plan
        } catch (err) {
            console.error('Order failed', err);
            alert('Failed to place order.');
        }
    };

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategoryId ? p.category_id === activeCategoryId : true;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) return <div className="p-8 text-center">Loading Menu...</div>;

    const totals = calculateTotals();

    return (
        <div className="flex h-screen bg-cream-50 overflow-hidden">
            {/* LEFT COLUMN: Menu */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar (Search & Categories) */}
                <div className="bg-white border-b border-cream-200 p-4 shadow-sm z-10">
                    <div className="flex justify-between mb-4">
                        <button onClick={() => navigate('/pos/floors')} className="text-coffee-600 font-medium">← Back to Tables</button>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="input-field w-64 py-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategoryId(cat.id)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${activeCategoryId === cat.id
                                        ? 'bg-coffee-600 text-white shadow-md'
                                        : 'bg-cream-100 text-espresso-700 hover:bg-cream-200'
                                    }`}
                                style={activeCategoryId === cat.id ? { backgroundColor: cat.color || '#4b3621' } : {}}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-cream-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md cursor-pointer border border-cream-100 overflow-hidden transition-transform active:scale-95 flex flex-col h-40"
                            >
                                {/* Image Placeholder */}
                                <div className="h-24 bg-cover bg-center bg-cream-200 flex items-center justify-center relative overflow-hidden">
                                    {/* If we had images: <img src={product.image} ... /> */}
                                    <span className="text-4xl">☕</span>
                                    <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-1.5 rounded text-xs font-bold text-espresso-900 shadow-sm">
                                        ${parseFloat(product.price).toFixed(2)}
                                    </div>
                                    {product.is_kitchen_sent === 1 && (
                                        <div className="absolute bottom-1 left-1 bg-yellow-100 text-yellow-800 text-[10px] px-1 rounded">
                                            Kitchen
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <h3 className="font-medium text-espresso-900 text-sm line-clamp-2 leading-tight">
                                        {product.name}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Cart */}
            <div className="w-96 bg-white border-l border-cream-300 flex flex-col shadow-xl z-20">
                <div className="p-4 bg-coffee-50 border-b border-coffee-100">
                    <h2 className="font-display font-bold text-espresso-900 text-lg">
                        Table {tableId}
                    </h2>
                    <p className="text-xs text-espresso-500">
                        Order #{new Date().getTime().toString().slice(-6)}
                    </p>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 mt-20">
                            <div className="text-4xl mb-2">🛒</div>
                            Cart is empty
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.key} className="flex justify-between items-center bg-cream-50 p-2 rounded border border-cream-100">
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-medium text-espresso-900 text-sm truncate">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-espresso-600">
                                        ${item.price.toFixed(2)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white rounded border border-cream-200">
                                        <button
                                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-cream-100 text-espresso-700"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold text-espresso-900">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-cream-100 text-espresso-700"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="w-16 text-right font-medium text-espresso-900 text-sm">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals Section */}
                <div className="bg-coffee-50 p-4 border-t border-coffee-100 space-y-2">
                    <div className="flex justify-between text-sm text-espresso-700">
                        <span>Subtotal</span>
                        <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-espresso-700">
                        <span>Tax</span>
                        <span>${totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-espresso-900 pt-2 border-t border-coffee-200 mt-2">
                        <span>Total</span>
                        <span>${totals.total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={cart.length === 0}
                        className={`w-full py-4 rounded-lg font-bold text-lg mt-4 shadow-lg transition-transform active:scale-95 ${cart.length > 0
                                ? 'bg-coffee-600 text-white hover:bg-coffee-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Pay & Validate
                    </button>
                </div>
            </div>

            {/* Variant Modal */}
            {isVariantModalOpen && selectedProductForVariant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="bg-coffee-600 p-4 text-white">
                            <h3 className="text-lg font-bold">Select Option</h3>
                            <p className="text-sm opacity-90">{selectedProductForVariant.name}</p>
                        </div>

                        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            {/* Add "Base Product" option if desired, or simplified logic: just variants */}
                            {selectedProductForVariant.variants.map(variant => (
                                <button
                                    key={variant.id}
                                    onClick={() => handleVariantSelect(variant)}
                                    className="w-full flex justify-between items-center p-4 rounded-lg border border-cream-200 hover:border-coffee-500 hover:bg-coffee-50 transition-all text-left group"
                                >
                                    <div>
                                        <span className="font-bold text-espresso-900 block group-hover:text-coffee-700">
                                            {variant.value}
                                        </span>
                                        <span className="text-xs text-espresso-500 uppercase">
                                            {variant.attribute_name}
                                        </span>
                                    </div>
                                    <div className="text-coffee-700 font-medium">
                                        {parseFloat(variant.extra_price) > 0
                                            ? `+$${variant.extra_price}`
                                            : 'Initial Price'}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="bg-gray-50 p-3 text-right">
                            <button
                                onClick={() => setIsVariantModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSOrder;
