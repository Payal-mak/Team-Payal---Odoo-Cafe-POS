import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import './ReportsPage.css';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

const ReportsPage = () => {
    const [duration, setDuration] = useState('Today');

    // Filters array representation
    const [filters, setFilters] = useState([
        { id: 'period', label: 'Select period' },
        { id: 'responsible', label: 'Responsible' },
        { id: 'session', label: 'Session' },
        { id: 'product', label: 'Product' }
    ]);

    const { data: rawData, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['advanced-reports', duration],
        queryFn: async () => {
            const res = await api.get(`/reports/advanced?duration=${duration}`);
            return res.data.data;
        }
    });

    const removeFilter = (id) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    // Derived Metrics for Cards
    const currSummary = rawData?.summary?.current || { total_orders: 0, revenue: 0 };
    const prevSummary = rawData?.summary?.previous || { total_orders: 0, revenue: 0 };

    const currAvg = currSummary.total_orders > 0 ? (currSummary.revenue / currSummary.total_orders) : 0;
    const prevAvg = prevSummary.total_orders > 0 ? (prevSummary.revenue / prevSummary.total_orders) : 0;

    const calcPercent = (curr, prev) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    };

    const ordersPercent = calcPercent(currSummary.total_orders, prevSummary.total_orders);
    const revPercent = calcPercent(currSummary.revenue, prevSummary.revenue);
    const avgPercent = calcPercent(currAvg, prevAvg);

    // Format Graph Data (ensure numbers)
    const salesData = (rawData?.salesData || []).map(d => ({
        time: d.time,
        revenue: Number(d.revenue)
    }));

    // Format Pie Data
    const pieData = (rawData?.topCategories || []).map(cat => ({
        name: cat.name,
        value: Number(cat.revenue)
    }));

    const renderPercent = (val) => {
        const isPos = val >= 0;
        return (
            <span className={`rp-percent ${isPos ? 'pos' : 'neg'}`}>
                {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(val).toFixed(1)}% Since last period
            </span>
        );
    };

    return (
        <div className="reports-page">
            <div className="rp-header">
                <div>
                    <h4 className="rp-breadcrumb">DashBoards</h4>
                    <h1 className="rp-title">Dashboard</h1>
                </div>

                <div className="rp-export-group">
                    <button className="rp-export-btn" disabled><Download size={14} /> PDF</button>
                    <button className="rp-export-btn" disabled><Download size={14} /> XLS</button>
                </div>
            </div>

            <div className="rp-filters">
                <div className="rp-chips">
                    {filters.map(f => (
                        <div key={f.id} className="rp-chip">
                            {f.label}
                            <button onClick={() => removeFilter(f.id)}><X size={12} /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rp-layout">
                {/* Left Sidebar Filter */}
                <div className="rp-sidebar">
                    <button className="rp-refresh-btn" onClick={() => refetch()} disabled={isFetching}>
                        <RefreshCw size={14} className={isFetching ? 'spin' : ''} /> Refresh
                    </button>
                    <h3 className="rp-sd-title">Duration</h3>
                    <ul className="rp-sd-list">
                        {['Today', 'Weekly', 'Monthly', '365 Days', 'Custom'].map(dur => (
                            <li
                                key={dur}
                                className={duration === dur ? 'active' : ''}
                                onClick={() => setDuration(dur)}
                            >
                                {dur}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Content */}
                <div className="rp-main">
                    {isLoading ? (
                        <div className="rp-loading">Loading reports...</div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="rp-summary-grid">
                                <div className="rp-card">
                                    <p className="rp-card-title">Total Order</p>
                                    <h2 className="rp-card-val">{currSummary.total_orders}</h2>
                                    {renderPercent(ordersPercent)}
                                </div>
                                <div className="rp-card">
                                    <p className="rp-card-title">Revenue</p>
                                    <h2 className="rp-card-val">₹{Number(currSummary.revenue).toFixed(2)}</h2>
                                    {renderPercent(revPercent)}
                                </div>
                                <div className="rp-card">
                                    <p className="rp-card-title">Average Order</p>
                                    <h2 className="rp-card-val">₹{currAvg.toFixed(2)}</h2>
                                    {renderPercent(avgPercent)}
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="rp-charts-grid">
                                <div className="rp-card rp-graph-container">
                                    <h3 className="rp-sec-title">Sales Graph</h3>
                                    <div className="rp-graph">
                                        <ResponsiveContainer width="100%" height={250}>
                                            {duration === 'Today' || duration === 'Weekly' ? (
                                                <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <XAxis dataKey="time" stroke="#888" fontSize={12} tickMargin={10} />
                                                    <YAxis stroke="#888" fontSize={12} />
                                                    <RechartsTooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '8px' }} />
                                                    <Bar dataKey="revenue" fill="#F4A261" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            ) : (
                                                <LineChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <XAxis dataKey="time" stroke="#888" fontSize={12} tickMargin={10} />
                                                    <YAxis stroke="#888" fontSize={12} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                                                    <Line type="monotone" dataKey="revenue" stroke="#F4A261" strokeWidth={3} dot={{ r: 4 }} />
                                                </LineChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="rp-card rp-pie-container">
                                    <h3 className="rp-sec-title">Top Selling Category</h3>
                                    <div className="rp-pie">
                                        {pieData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="rp-empty">No category data for this period.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tables Array */}
                            <div className="rp-tables-grid">
                                <div className="rp-card rp-table-wrap rp-col-span-2">
                                    <h3 className="rp-sec-title">Top Orders</h3>
                                    <table className="rp-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Session</th>
                                                <th>Total</th>
                                                <th>Qty</th>
                                                <th>Customer</th>
                                                <th>Average</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rawData?.topOrders?.length > 0 ? rawData.topOrders.map((o, i) => (
                                                <tr key={i}>
                                                    <td>{format(new Date(o.Date), 'MMM dd, h:mm a')}</td>
                                                    <td>{o.Session || 'Current'}</td>
                                                    <td>₹{Number(o.Total).toFixed(2)}</td>
                                                    <td>{o.Qty}</td>
                                                    <td>{o.Customer}</td>
                                                    <td>₹{(Number(o.Total) / Math.max(o.Qty, 1)).toFixed(2)}</td>
                                                </tr>
                                            )) : <tr><td colSpan="6" className="rp-empty">No orders found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="rp-card rp-table-wrap">
                                    <h3 className="rp-sec-title">Top Product</h3>
                                    <table className="rp-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rawData?.topProduct?.length > 0 ? rawData.topProduct.map((p, i) => (
                                                <tr key={i}>
                                                    <td>{p.Product}</td>
                                                    <td>{p.Qty}</td>
                                                    <td>₹{Number(p.Revenue).toFixed(2)}</td>
                                                </tr>
                                            )) : <tr><td colSpan="3" className="rp-empty">No products found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
