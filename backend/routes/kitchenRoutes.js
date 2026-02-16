const express = require('express');
const router = express.Router();
const { getKitchenOrders, updateKitchenOrderStatus, updateKitchenItemStatus, getKitchenStats } = require('../controllers/kitchenController');
const { protect, authorize } = require('../middleware/auth');

router.get('/orders', protect, authorize('kitchen_staff', 'admin'), getKitchenOrders);
router.put('/orders/:id/status', protect, authorize('kitchen_staff', 'admin'), updateKitchenOrderStatus);
router.put('/items/:id/status', protect, authorize('kitchen_staff', 'admin'), updateKitchenItemStatus);
router.get('/stats', protect, authorize('kitchen_staff', 'admin'), getKitchenStats);

module.exports = router;
