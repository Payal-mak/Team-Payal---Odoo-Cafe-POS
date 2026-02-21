import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Clock,
    Search,
    ChevronRight,
    Check,
    ChevronLeft,
    Filter,
    X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './KitchenPage.css';

const KitchenPage = () => {
    const queryClient = useQueryClient();
    const [selectedStage, setSelectedStage] = useState('to_cook');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const itemsPerPage = 6;

    // Fetch kitchen orders
    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['kitchen-orders', selectedStage],
        queryFn: async () => {
            const response = await api.get(`/kitchen/orders?stage=${selectedStage}`);
            return response.data.data;
        },
        refetchInterval: 5000, // Refresh every 5 seconds
    });

    // Fetch stage counts
    const { data: statsData } = useQuery({
        queryKey: ['kitchen-stats'],
        queryFn: async () => {
            const response = await api.get('/kitchen/stats');
            return response.data.data;
        },
        refetchInterval: 5000,
    });

    // Fetch categories for filter
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data.data;
        }
    });

    // Update item status mutation
    const updateItemMutation = useMutation({
        mutationFn: async ({ itemId, status }) => {
            const response = await api.put(`/kitchen/items/${itemId}`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['kitchen-orders']);
            queryClient.invalidateQueries(['kitchen-stats']);
        }
    });

    // Update order stage mutation
    const updateOrderMutation = useMutation({
        mutationFn: async ({ orderId, stage }) => {
            const response = await api.put(`/kitchen/orders/${orderId}`, { stage });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Order moved to next stage');
            queryClient.invalidateQueries(['kitchen-orders']);
            queryClient.invalidateQueries(['kitchen-stats']);
        }
    });

    const handleItemClick = (item) => {
        const newStatus = item.status === 'pending' ? 'preparing' : 'ready';
        updateItemMutation.mutate({ itemId: item.id, status: newStatus });
    };

    const handleMoveToNextStage = (order) => {
        let nextStage = '';
        if (selectedStage === 'to_cook') nextStage = 'preparing';
        else if (selectedStage === 'preparing') nextStage = 'completed';

        if (nextStage) {
            updateOrderMutation.mutate({ orderId: order.id, stage: nextStage });
        }
    };

    // Filter orders by search and category
    const filteredOrders = ordersData?.filter(order => {
        const matchesSearch = searchTerm === '' ||
            order.id.toString().includes(searchTerm) ||
            order.items?.some(item => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' ||
            order.items?.some(item => item.category_id?.toString() === selectedCategory);

        return matchesSearch && matchesCategory;
    });

    // Pagination
    const totalPages = Math.ceil((filteredOrders?.length || 0) / itemsPerPage);
    const paginatedOrders = filteredOrders?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStage, searchTerm, selectedCategory]);

    const stages = [
        { key: 'to_cook', label: 'To Cook', count: statsData?.to_cook || 0 },
        { key: 'preparing', label: 'Preparing', count: statsData?.preparing || 0 },
        { key: 'completed', label: 'Completed', count: statsData?.completed || 0 }
    ];

    return (
        <div className="kitchen-page">
            <div className="kitchen-header">
                <h1>Kitchen Display</h1>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search by order # or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className={`filter-toggle ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter size={20} />
                        Filters
                    </button>
                </div>
            </div>

            {/* Stage Filters */}
            <div className="stage-filters">
                {stages.map(stage => (
                    <button
                        key={stage.key}
                        className={`stage-btn ${selectedStage === stage.key ? 'active' : ''}`}
                        onClick={() => setSelectedStage(stage.key)}
                    >
                        <span className="stage-label">{stage.label}</span>
                        <span className="stage-count">{stage.count}</span>
                    </button>
                ))}
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="filter-panel">
                    <div className="filter-header">
                        <h3>Filters</h3>
                        <button className="close-btn" onClick={() => setShowFilters(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="filter-section">
                        <label>Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Categories</option>
                            {categoriesData?.map(category => (
                                <option key={category.id} value={category.id.toString()}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="clear-filters-btn"
                        onClick={() => {
                            setSelectedCategory('all');
                            setSearchTerm('');
                        }}
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

            {/* Orders Grid */}
            {isLoading ? (
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading orders...</p>
                </div>
            ) : paginatedOrders && paginatedOrders.length > 0 ? (
                <>
                    <div className="orders-grid">
                        {paginatedOrders.map(order => (
                            <OrderTicket
                                key={order.id}
                                order={order}
                                stage={selectedStage}
                                onItemClick={handleItemClick}
                                onMoveNext={handleMoveToNextStage}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="page-btn"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index + 1}
                                    className={`page-number ${currentPage === index + 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}

                            <button
                                className="page-btn"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <Check size={48} />
                    <p>No orders in {stages.find(s => s.key === selectedStage)?.label}</p>
                    <span>Orders will appear here when they arrive</span>
                </div>
            )}
        </div>
    );
};

// Order Ticket Component
const OrderTicket = ({ order, stage, onItemClick, onMoveNext }) => {
    const [timeElapsed, setTimeElapsed] = useState('');

    useEffect(() => {
        const updateTime = () => {
            setTimeElapsed(formatDistanceToNow(new Date(order.created_at), { addSuffix: true }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [order.created_at]);

    const getTicketColor = () => {
        const minutes = (Date.now() - new Date(order.created_at).getTime()) / 60000;
        if (minutes > 30) return 'urgent';
        if (minutes > 15) return 'warning';
        return 'normal';
    };

    return (
        <div className={`order-ticket ${getTicketColor()}`}>
            <div className="ticket-header">
                <div className="order-info">
                    <h3>Order #{order.id}</h3>
                    <span className="order-type">{order.order_type}</span>
                </div>
                <div className="time-badge">
                    <Clock size={14} />
                    <span>{timeElapsed}</span>
                </div>
            </div>

            {order.table_name && (
                <div className="table-info">
                    Table: {order.table_name}
                </div>
            )}

            <div className="ticket-items">
                {order.items?.map((item, index) => (
                    <div
                        key={index}
                        className={`ticket-item ${item.status === 'ready' ? 'completed' : ''}`}
                        onClick={() => onItemClick(item)}
                    >
                        <div className="item-quantity">{item.quantity}x</div>
                        <div className="item-name">{item.product_name}</div>
                        {item.status === 'ready' && (
                            <Check size={16} className="check-icon" />
                        )}
                    </div>
                ))}
            </div>

            {order.notes && (
                <div className="order-notes">
                    <strong>Notes:</strong> {order.notes}
                </div>
            )}

            <button
                className="next-stage-btn"
                onClick={() => onMoveNext(order)}
            >
                {stage === 'to_cook' && 'Start Preparing'}
                {stage === 'preparing' && 'Mark as Complete'}
                {stage === 'completed' && 'Done'}
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default KitchenPage;
