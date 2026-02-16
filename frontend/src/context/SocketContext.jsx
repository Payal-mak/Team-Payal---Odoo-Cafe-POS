import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Initialize socket connection
        const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            transports: ['websocket'],
            autoConnect: true
        });

        socketInstance.on('connect', () => {
            console.log('✅ Socket connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setIsConnected(false);
        });

        // Listen for real-time events
        socketInstance.on('new_order', (data) => {
            console.log('📦 New order received:', data);
            toast.success(`New order #${data.order_number}`);

            // Invalidate queries to refresh data
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['dashboard-stats']);
            queryClient.invalidateQueries(['kitchen-orders']);
        });

        socketInstance.on('order_updated', (data) => {
            console.log('🔄 Order updated:', data);

            // Invalidate queries to refresh data
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['order', data.order_id]);
            queryClient.invalidateQueries(['kitchen-orders']);
        });

        socketInstance.on('kitchen_update', (data) => {
            console.log('👨‍🍳 Kitchen update:', data);

            // Invalidate kitchen queries
            queryClient.invalidateQueries(['kitchen-orders']);
            queryClient.invalidateQueries(['orders']);
        });

        socketInstance.on('customer_display_update', (data) => {
            console.log('📺 Customer display update:', data);

            // Invalidate customer display queries
            queryClient.invalidateQueries(['customer-orders']);
        });

        socketInstance.on('table_status_change', (data) => {
            console.log('🪑 Table status changed:', data);
            toast.info(`Table ${data.table_name} is now ${data.status}`);

            // Invalidate table queries
            queryClient.invalidateQueries(['tables']);
            queryClient.invalidateQueries(['floors']);
        });

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
            socketInstance.disconnect();
        };
    }, [queryClient]);

    const emit = (event, data) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, isConnected, emit }}>
            {children}
        </SocketContext.Provider>
    );
};
