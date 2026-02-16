import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import {
    Calendar,
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Download,
    BarChart3,
    Package,
    Tag,
    X
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import './ReportsPage.css';

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState('sales'); // sales, products, categories
    const [dateRange, setDateRange] = useState('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

    // Calculate date range
    const getDateRange = () => {
        const today = new Date();
        switch (dateRange) {
            case 'today':
                return {
                    start_date: format(today, 'yyyy-MM-dd'),
                    end_date: format(today, 'yyyy-MM-dd')
                };
            case 'week':
                return {
                    start_date: format(subDays(today, 7), 'yyyy-MM-dd'),
                    end_date: format(today, 'yyyy-MM-dd')
                };
            case 'month':
                return {
                    start_date: format(startOfMonth(today), 'yyyy-MM-dd'),
                    end_date: format(endOfMonth(today), 'yyyy-MM-dd')
                };
            case 'custom':
                return {
                    start_date: customStartDate,
                    end_date: customEndDate
                };
            default:
                return {};
        }
    };

    const dates = getDateRange();

    // Export functions
    const handleExport = async (format) => {
        try {
            const params = new URLSearchParams(dates);
            const url = `/reports/export/${format}?${params}`;

            // Create a temporary link to download the file
            const response = await api.get(url, { responseType: 'blob' });
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `sales-report-${dates.start_date}-to-${dates.end_date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            setShowExportModal(false);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    // Fetch sales report
    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ['sales-report', dates.start_date, dates.end_date],
        queryFn: async () => {
            const params = new URLSearchParams(dates);
            const response = await api.get(`/reports/sales?${params}`);
            return response.data.data;
        },
        enabled: activeTab === 'sales' && !!dates.start_date && !!dates.end_date
    });

    // Fetch top products
    const { data: topProductsData, isLoading: productsLoading } = useQuery({
        queryKey: ['top-products', dates.start_date, dates.end_date],
        queryFn: async () => {
            const params = new URLSearchParams({ ...dates, limit: 10 });
            const response = await api.get(`/reports/top-products?${params}`);
            return response.data.data;
        },
        enabled: activeTab === 'products' && !!dates.start_date && !!dates.end_date
    });

    // Fetch top categories
    const { data: topCategoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ['top-categories', dates.start_date, dates.end_date],
        queryFn: async () => {
            const params = new URLSearchParams(dates);
            const response = await api.get(`/reports/top-categories?${params}`);
            return response.data.data;
        },
        enabled: activeTab === 'categories' && !!dates.start_date && !!dates.end_date
    });

    // Calculate summary stats from sales data
    const summaryStats = salesData ? {
        totalRevenue: salesData.reduce((sum, day) => sum + Number(day.total_revenue || 0), 0),
        totalOrders: salesData.reduce((sum, day) => sum + Number(day.total_orders || 0), 0),
        avgOrderValue: 0
    } : { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    if (summaryStats.totalOrders > 0) {
        summaryStats.avgOrderValue = summaryStats.totalRevenue / summaryStats.totalOrders;
    }

    return (
        <Layout>
            <div className="reports-page">
                <div className="page-header">
                    <div>
                        <h1>Reports & Analytics</h1>
                        <p>View sales performance and insights</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>
                        <Download size={18} />
                        Export Report
                    </button>
                </div>

                {/* Export Modal */}
                {showExportModal && (
                    <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
                        <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Export Report</h2>
                                <button className="close-btn" onClick={() => setShowExportModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Select export format:</p>
                                <div className="export-options">
                                    <button className="export-option-btn" onClick={() => handleExport('pdf')}>
                                        <Download size={32} />
                                        <span>PDF Document</span>
                                    </button>
                                    <button className="export-option-btn" onClick={() => handleExport('excel')}>
                                        <Download size={32} />
                                        <span>Excel Spreadsheet</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Date Range Selector */}
                <div className="date-range-section">
                    <div className="date-filters">
                        <button
                            className={`filter-btn ${dateRange === 'today' ? 'active' : ''}`}
                            onClick={() => setDateRange('today')}
                        >
                            Today
                        </button>
                        <button
                            className={`filter-btn ${dateRange === 'week' ? 'active' : ''}`}
                            onClick={() => setDateRange('week')}
                        >
                            This Week
                        </button>
                        <button
                            className={`filter-btn ${dateRange === 'month' ? 'active' : ''}`}
                            onClick={() => setDateRange('month')}
                        >
                            This Month
                        </button>
                        <button
                            className={`filter-btn ${dateRange === 'custom' ? 'active' : ''}`}
                            onClick={() => setDateRange('custom')}
                        >
                            Custom Range
                        </button>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="custom-date-inputs">
                            <div className="date-input">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>
                            <div className="date-input">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Report Tabs */}
                <div className="report-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sales')}
                    >
                        <BarChart3 size={18} />
                        Sales Report
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        <Package size={18} />
                        Top Products
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        <Tag size={18} />
                        Top Categories
                    </button>
                </div>

                {/* Sales Report Tab */}
                {activeTab === 'sales' && (
                    <div className="report-content">
                        {/* Summary Cards */}
                        <div className="summary-cards">
                            <div className="summary-card revenue">
                                <div className="card-icon">
                                    <DollarSign size={24} />
                                </div>
                                <div className="card-content">
                                    <p className="card-label">Total Revenue</p>
                                    <h3 className="card-value">₹{summaryStats.totalRevenue.toFixed(2)}</h3>
                                </div>
                            </div>

                            <div className="summary-card orders">
                                <div className="card-icon">
                                    <ShoppingBag size={24} />
                                </div>
                                <div className="card-content">
                                    <p className="card-label">Total Orders</p>
                                    <h3 className="card-value">{summaryStats.totalOrders}</h3>
                                </div>
                            </div>

                            <div className="summary-card average">
                                <div className="card-icon">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="card-content">
                                    <p className="card-label">Avg Order Value</p>
                                    <h3 className="card-value">₹{summaryStats.avgOrderValue.toFixed(2)}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Sales Table */}
                        {salesLoading ? (
                            <div className="loading-container">
                                <div className="spinner-large"></div>
                                <p>Loading sales data...</p>
                            </div>
                        ) : salesData && salesData.length > 0 ? (
                            <div className="card">
                                <h3 className="card-title">Daily Breakdown</h3>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Orders</th>
                                            <th>Subtotal</th>
                                            <th>Tax</th>
                                            <th>Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesData.map((day, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="date-cell">
                                                        <Calendar size={16} />
                                                        {day.date ? format(new Date(day.date), 'MMM dd, yyyy') : 'N/A'}
                                                    </div>
                                                </td>
                                                <td>{day.total_orders}</td>
                                                <td>₹{Number(day.subtotal || 0).toFixed(2)}</td>
                                                <td>₹{Number(day.tax_amount || 0).toFixed(2)}</td>
                                                <td className="revenue-cell">
                                                    ₹{Number(day.total_revenue || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <BarChart3 size={48} />
                                <p>No sales data for selected period</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Top Products Tab */}
                {activeTab === 'products' && (
                    <div className="report-content">
                        {productsLoading ? (
                            <div className="loading-container">
                                <div className="spinner-large"></div>
                                <p>Loading products data...</p>
                            </div>
                        ) : topProductsData && topProductsData.length > 0 ? (
                            <div className="card">
                                <h3 className="card-title">Top 10 Products</h3>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Quantity Sold</th>
                                            <th>Times Ordered</th>
                                            <th>Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProductsData.map((product, index) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <span className="rank-badge">#{index + 1}</span>
                                                </td>
                                                <td className="product-name">{product.name}</td>
                                                <td>{product.category_name}</td>
                                                <td>{product.quantity_sold} units</td>
                                                <td>{product.times_ordered}</td>
                                                <td className="revenue-cell">
                                                    ₹{Number(product.total_revenue || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Package size={48} />
                                <p>No product data for selected period</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Top Categories Tab */}
                {activeTab === 'categories' && (
                    <div className="report-content">
                        {categoriesLoading ? (
                            <div className="loading-container">
                                <div className="spinner-large"></div>
                                <p>Loading categories data...</p>
                            </div>
                        ) : topCategoriesData && topCategoriesData.length > 0 ? (
                            <div className="card">
                                <h3 className="card-title">Category Performance</h3>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Quantity Sold</th>
                                            <th>Times Ordered</th>
                                            <th>Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCategoriesData.map((category) => (
                                            <tr key={category.id}>
                                                <td>
                                                    <div className="category-cell">
                                                        <div
                                                            className="color-dot"
                                                            style={{ background: category.color }}
                                                        ></div>
                                                        {category.name}
                                                    </div>
                                                </td>
                                                <td>{category.quantity_sold} units</td>
                                                <td>{category.times_ordered}</td>
                                                <td className="revenue-cell">
                                                    ₹{Number(category.total_revenue || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Tag size={48} />
                                <p>No category data for selected period</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ReportsPage;
