import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { kitchenAPI } from '../services/api';
import io from 'socket.io-client';

const KitchenDisplay = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveOrders();

        // Socket Setup
        const socket = io('http://localhost:3000'); // Adjust for prod

        socket.on('connect', () => {
            console.log('Connected to Kitchen Socket');
        });

        socket.on('new_order', (newOrder) => {
            console.log('New kitchen order:', newOrder);
            setOrders(prev => {
                if (prev.find(o => o.id === newOrder.id)) return prev;
                return [...prev, newOrder];
            });
        });

        socket.on('order_update', (update) => {
            console.log('Order update:', update);
            setOrders(prev => prev.map(o =>
                o.id === update.id ? { ...o, kitchen_stage: update.kitchen_stage } : o
            ));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchActiveOrders = async () => {
        try {
            const response = await kitchenAPI.getActive();
            setOrders(response.data.data.orders);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch kitchen orders', err);
            setLoading(false);
        }
    };

    const handleStageUpdate = async (orderId, currentStage) => {
        let nextStage;
        if (currentStage === 'to_cook') nextStage = 'preparing';
        else if (currentStage === 'preparing') nextStage = 'completed';
        else return;

        try {
            // Optimistic update
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, kitchen_stage: nextStage } : o
            ));

            await kitchenAPI.updateStage(orderId, nextStage);

            // If completed, remove from view after short delay?
            // Or keep in completed column for a bit. The API filters 'completed', 
            // so on refresh it will disappear.
        } catch (err) {
            console.error('Failed to update stage', err);
            fetchActiveOrders(); // Revert on error
        }
    };

    // Helper to format time elapsed
    const TimeElapsed = ({ startDate }) => {
        const [elapsed, setElapsed] = useState('');

        useEffect(() => {
            const interval = setInterval(() => {
                const start = new Date(startDate);
                const now = new Date();
                const diff = Math.floor((now - start) / 1000); // seconds

                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                setElapsed(`${mins}m ${secs}s`);
            }, 1000);
            return () => clearInterval(interval);
        }, [startDate]);

        return <span className="font-mono text-sm">{elapsed}</span>;
    };

    if (loading) return <div className="p-8 text-center">Loading Kitchen Display...</div>;

    const toCook = orders.filter(o => o.kitchen_stage === 'to_cook');
    const preparing = orders.filter(o => o.kitchen_stage === 'preparing');
    const completed = orders.filter(o => o.kitchen_stage === 'completed');

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center shadow-lg">
                <h1 className="text-xl font-bold font-display">👨‍🍳 Kitchen Display System</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm bg-gray-700 px-3 py-1 rounded-full">
                        Active: {orders.filter(o => o.kitchen_stage !== 'completed').length}
                    </span>
                    <button onClick={() => { logout(); navigate('/login'); }} className="text-gray-400 hover:text-white text-sm">
                        Logout
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden p-4 flex gap-4">

                {/* Column 1: To Cook */}
                <div className="flex-1 bg-white rounded-xl shadow-md flex flex-col border-t-4 border-red-500 overflow-hidden">
                    <div className="p-3 bg-red-50 border-b border-red-100 flex justify-between items-center">
                        <h2 className="font-bold text-red-700 uppercase tracking-wide">To Cook</h2>
                        <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">{toCook.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                        {toCook.map(order => (
                            <OrderCard key={order.id} order={order} onAction={() => handleStageUpdate(order.id, 'to_cook')} actionLabel="Start Cooking" colorClass="border-l-4 border-red-500" />
                        ))}
                    </div>
                </div>

                {/* Column 2: Preparing */}
                <div className="flex-1 bg-white rounded-xl shadow-md flex flex-col border-t-4 border-yellow-500 overflow-hidden">
                    <div className="p-3 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center">
                        <h2 className="font-bold text-yellow-700 uppercase tracking-wide">Preparing</h2>
                        <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{preparing.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                        {preparing.map(order => (
                            <OrderCard key={order.id} order={order} onAction={() => handleStageUpdate(order.id, 'preparing')} actionLabel="Mark Done" colorClass="border-l-4 border-yellow-500" />
                        ))}
                    </div>
                </div>

                {/* Column 3: Completed */}
                <div className="flex-1 bg-white rounded-xl shadow-md flex flex-col border-t-4 border-green-500 overflow-hidden opacity-90">
                    <div className="p-3 bg-green-50 border-b border-green-100 flex justify-between items-center">
                        <h2 className="font-bold text-green-700 uppercase tracking-wide">Ready</h2>
                        <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">{completed.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                        {completed.map(order => (
                            <OrderCard key={order.id} order={order} isCompleted={true} colorClass="border-l-4 border-green-500" />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const OrderCard = ({ order, onAction, actionLabel, colorClass, isCompleted }) => {
    // Calculate relative time color based on age? Optional.
    return (
        <div
            className={`bg-white p-4 rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer ${colorClass}`}
            onClick={!isCompleted ? onAction : undefined}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Order #{order.order_number.split('-').pop()}</h3>
                    <p className="text-sm text-gray-500">Table {order.table_id}</p>
                </div>
                {!isCompleted && (
                    <div className="text-right">
                        <div className="text-xs font-bold text-gray-400">Time</div>
                        {/* Use a simple component to avoid re-rendering entire list every second? 
                 Ideally yes, defined in parent scope. */}
                        {/* Using simplified timestamp for now */}
                        <span className="text-xs font-mono bg-gray-100 px-1 rounded">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 pt-2 space-y-1 mb-3">
                {order.lines && order.lines.map((line, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-800">
                            {line.quantity}x {line.product_name}
                            {line.variant_value && <span className="text-gray-500 text-xs ml-1">({line.variant_value})</span>}
                        </span>
                    </div>
                ))}
            </div>

            {!isCompleted && (
                <button
                    className="w-full mt-2 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wider rounded border border-gray-200"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default KitchenDisplay;
