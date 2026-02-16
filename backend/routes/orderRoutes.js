const express = require('express');
const router = express.Router();
const {
    getOrders, createOrder, getOrder, updateOrder, deleteOrder,
    sendToKitchen, updateOrderStatus, getOrdersByTable
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getOrders);
router.post('/', protect, createOrder);
router.get('/table/:tableId', protect, getOrdersByTable);
router.get('/:id', protect, getOrder);
router.put('/:id', protect, updateOrder);
router.delete('/:id', protect, deleteOrder);
router.post('/:id/send-to-kitchen', protect, sendToKitchen);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
