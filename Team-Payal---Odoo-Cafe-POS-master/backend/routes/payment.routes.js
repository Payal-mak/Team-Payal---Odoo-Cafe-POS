import express from 'express';
import { getPaymentMethods, processPayment } from '../controllers/payment.controller.js';

const router = express.Router();

// Get payment methods for a POS config
router.get('/payment-methods/:posConfigId', getPaymentMethods);

// Process payment for an order
router.post('/orders/:orderId/pay', processPayment);

export default router;
