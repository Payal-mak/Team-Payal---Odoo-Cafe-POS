import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const SelfOrderMenu = () => {
    const { token } = useParams();
    const [tableInfo, setTableInfo] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);

    useEffect(() => {
        const fetchMenuData = async () => {
            try {
                // 1. Verify Token & Get Table Info
                const tableRes = await api.get(`/tables/public/by-token/${token}`);
                setTableInfo(tableRes.data.data.table);

                // 2. Fetch Categories & Products (Public)
                const [catRes, prodRes] = await Promise.all([
                    api.get('/categories'),
                    api.get('/products')
                ]);

                setCategories(catRes.data.data.categories);
                setProducts(prodRes.data.data.products);

                if (catRes.data.data.categories.length > 0) {
                    setActiveCategory(catRes.data.data.categories[0].id);
                }
                setLoading(false);
            } catch (err) {
                console.error('Menu load failed', err);
                setError('Invalid or expired menu link.');
                setLoading(false);
            }
        };
        fetchMenuData();
    }, [token]);

    const filteredProducts = products.filter(p => activeCategory ? p.category_id === activeCategory : true);

    if (loading) return <div className="h-screen flex items-center justify-center bg-cream-50 text-coffee-600 font-bold">Loading Menu...</div>;
    if (error) return <div className="h-screen flex items-center justify-center bg-cream-50 text-red-600 p-4 text-center">{error}</div>;

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header */}
            <div className="bg-coffee-900 text-white p-6 sticky top-0 z-20 shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="font-display font-bold text-xl">Odoo Cafe</h1>
                        <p className="text-sm opacity-80 text-coffee-200">Table {tableInfo.number} • {tableInfo.floor_name}</p>
                    </div>
                    {/* Placeholder for Cart/Status */}
                    <div className="bg-coffee-800 p-2 rounded-full">
                        🛍️
                    </div>
                </div>
            </div>

            {/* Category Scroll */}
            <div className="bg-cream-100 p-3 sticky top-[76px] z-10 overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-cream-200">
                <div className="flex gap-3">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${activeCategory === cat.id
                                    ? 'bg-coffee-600 text-white scale-105'
                                    : 'bg-white text-coffee-800 hover:bg-cream-50'
                                }`}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#ccc' }}></span>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product List */}
            <div className="p-4 space-y-4 max-w-lg mx-auto">
                <h2 className="font-bold text-espresso-900 border-l-4 border-coffee-500 pl-3">
                    {categories.find(c => c.id === activeCategory)?.name || 'Menu'}
                </h2>

                {filteredProducts.map(product => (
                    <div key={product.id} className="flex bg-white rounded-xl shadow-sm border border-cream-100 overflow-hidden h-28">
                        {/* Image */}
                        <div className="w-24 bg-cream-200 flex items-center justify-center text-3xl">
                            ☕
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-espresso-900 line-clamp-1">{product.name}</h3>
                                <p className="text-xs text-espresso-500 line-clamp-2 mt-1">{product.description || 'Delicious cafe treat.'}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="font-bold text-coffee-700">${parseFloat(product.price).toFixed(2)}</span>
                                <button className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                                    Unavailable
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Banner */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <p className="text-center text-xs text-gray-500">
                    Self-ordering coming soon. Please call waiter to order.
                </p>
                <button className="mt-2 w-full bg-coffee-800 text-white font-bold py-3 rounded-lg shadow active:scale-95 transition-transform">
                    🛎️ Call Waiter
                </button>
            </div>
        </div>
    );
};

export default SelfOrderMenu;
