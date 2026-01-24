import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await reportAPI.getDashboard();
                setStats(response.data.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load dashboard stats', err);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-espresso-600">Loading Dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data.</div>;

    const { revenue, totalOrders, topProducts, recentOrders } = stats;
    // Calculate Avg Order Value
    const avgOrderValue = totalOrders > 0 ? (revenue / totalOrders).toFixed(2) : 0;

    // Format data for chart
    const chartData = topProducts.map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        sold: parseInt(p.quantity_sold)
    }));

    return (
        <div className="flex h-screen bg-cream-50">
            {/* Sidebar */}
            <div className="w-64 bg-coffee-800 text-cream-100 flex flex-col shadow-xl">
                <div className="p-6 border-b border-coffee-700">
                    <h1 className="text-2xl font-display font-bold text-white">Odoo Cafe</h1>
                    <p className="text-xs text-coffee-300 mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button className="w-full text-left px-4 py-3 bg-coffee-700 rounded-lg text-white font-medium">
                        📊 Dashboard
                    </button>
                    <button onClick={() => navigate('/admin/products')} className="w-full text-left px-4 py-3 hover:bg-coffee-700 rounded-lg text-coffee-100 font-medium transition-colors">
                        ☕ Products
                    </button>
                    <button onClick={() => navigate('/admin/categories')} className="w-full text-left px-4 py-3 hover:bg-coffee-700 rounded-lg text-coffee-100 font-medium transition-colors">
                        📂 Categories
                    </button>
                    <button onClick={() => navigate('/admin/floor-plan')} className="w-full text-left px-4 py-3 hover:bg-coffee-700 rounded-lg text-coffee-100 font-medium transition-colors">
                        🪑 Floor Plan
                    </button>
                </nav>

                <div className="p-4 border-t border-coffee-700">
                    <button onClick={() => { logout(); navigate('/login'); }} className="w-full px-4 py-2 bg-coffee-900 hover:bg-red-900/50 rounded text-sm text-coffee-200 transition-colors">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-display font-bold text-espresso-900">Dashboard</h2>
                        <span className="text-sm text-espresso-500 bg-white px-3 py-1 rounded shadow-sm border border-cream-200">
                            {new Date().toLocaleDateString()}
                        </span>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Revenue */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200 flex flex-col">
                            <span className="text-espresso-500 font-bold uppercase text-xs tracking-wider">Total Revenue</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-coffee-600">${parseFloat(revenue).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Orders */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200 flex flex-col">
                            <span className="text-espresso-500 font-bold uppercase text-xs tracking-wider">Total Orders</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-blue-600">{totalOrders}</span>
                            </div>
                        </div>

                        {/* Avg Order Value */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200 flex flex-col">
                            <span className="text-espresso-500 font-bold uppercase text-xs tracking-wider">Avg Order Value</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-green-600">${avgOrderValue}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Chart: Top Products */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200">
                            <h3 className="font-bold text-lg text-espresso-900 mb-6">Top 5 Selling Products</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                        <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                                        <YAxis dataKey="name" type="category" width={100} stroke="#4B5563" fontSize={12} tick={{ fill: '#374151' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            cursor={{ fill: '#F3F4F6' }}
                                        />
                                        <Bar dataKey="sold" fill="#8B4513" radius={[0, 4, 4, 0]} barSize={20} name="Units Sold" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Orders List */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-cream-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-espresso-900">Recent Transactions</h3>
                                <button className="text-coffee-600 text-sm font-medium hover:underline">View All</button>
                            </div>
                            <div className="space-y-4">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center p-3 hover:bg-cream-50 rounded-lg transition-colors border border-transparent hover:border-cream-100">
                                        <div>
                                            <div className="font-bold text-espresso-800">{order.order_number.split('-').pop()}</div>
                                            <div className="text-xs text-espresso-500">{new Date(order.created_at).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-espresso-900">${parseFloat(order.total_amount).toFixed(2)}</div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {recentOrders.length === 0 && <p className="text-gray-500 text-center py-4">No recent orders</p>}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
