import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import './POSOrdersTab.css';

const STATUS_HINTS = {
    draft: { label: 'Draft', color: '#f59f00' },
    sent_to_kitchen: { label: 'Kitchen', color: '#3b82f6' },
    preparing: { label: 'Preparing', color: '#8b5cf6' },
    completed: { label: 'Ready', color: '#10b981' },
    paid: { label: 'Paid', color: '#10b981' },
    cancelled: { label: 'Cancelled', color: '#ef4444' }
};

const POSOrdersTab = ({ sessionId }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['orders', sessionId],
        queryFn: async () => {
            const response = await api.get(sessionId ? `/orders?session_id=${sessionId}` : '/orders');
            return response.data.data || [];
        },
        refetchInterval: 10000 // auto-refresh every 10s
    });

    const filteredOrders = ordersData?.filter(order => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            order.order_number?.toLowerCase().includes(term) ||
            order.table_number?.toLowerCase().includes(term) ||
            order.customer_name?.toLowerCase().includes(term)
        );
    }) || [];

    if (isLoading) {
        return (
            <div className="pos-orders-loading">
                <div className="spinner-large"></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="pos-orders-tab">
            <div className="pos-orders-header">
                <h2>Session Orders</h2>
                <div className="pos-orders-search">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search Order No, Table..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="pos-orders-content">
                <table className="pos-orders-table">
                    <thead>
                        <tr>
                            <th>Order No.</th>
                            <th>Time</th>
                            <th>Table / Context</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="pos-orders-empty">No orders found.</td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => {
                                const meta = STATUS_HINTS[order.status] || { label: order.status, color: '#999' };
                                return (
                                    <tr key={order.id}>
                                        <td className="fw-bold">{order.order_number}</td>
                                        <td>{format(new Date(order.created_at), 'hh:mm a')}</td>
                                        <td>{order.table_number ? `Table ${order.table_number}` : (order.customer_name || 'Takeaway')}</td>
                                        <td className="fw-bold">₹{Number(order.total_amount).toFixed(2)}</td>
                                        <td>
                                            <span
                                                className="pos-order-badge"
                                                style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                                            >
                                                {meta.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default POSOrdersTab;
