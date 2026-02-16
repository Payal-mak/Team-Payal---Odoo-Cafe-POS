const express = require('express');
const router = express.Router();
const {
    getPayments, processPayment, getPayment, getPaymentsByOrder, generateUPIQR,
    getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Payment routes
router.get('/', protect, getPayments);
router.post('/', protect, processPayment);
router.get('/:id', protect, getPayment);
router.get('/order/:orderId', protect, getPaymentsByOrder);
router.post('/upi-qr', protect, generateUPIQR);

// Payment method routes
router.get('/methods/all', protect, getPaymentMethods);
router.post('/methods', protect, authorize('admin'), createPaymentMethod);
router.put('/methods/:id', protect, authorize('admin'), updatePaymentMethod);
router.delete('/methods/:id', protect, authorize('admin'), deletePaymentMethod);

module.exports = router;
