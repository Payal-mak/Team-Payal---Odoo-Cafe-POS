import express from 'express';
import {
    createOrder,
    getOrderById,
    getAllOrders,
    getOrdersByTable,
    updateOrderStatus,
    sendToKitchen
} from '../controllers/orders.controller.js';

const router = express.Router();

// Create new order
router.post('/orders', createOrder);

// Get all orders (with filters)
router.get('/orders', getAllOrders);

// Get order by ID
router.get('/orders/:id', getOrderById);

// Get orders by table
router.get('/orders/table/:tableId', getOrdersByTable);

// Update order status
router.put('/orders/:id/status', updateOrderStatus);

// Send order to kitchen
router.post('/orders/:id/send-to-kitchen', sendToKitchen);

export default router;
