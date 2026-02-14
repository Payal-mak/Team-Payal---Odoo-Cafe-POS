import express from 'express';
import {
    getOrders,
    getOrderById,
    deleteOrders,
    getPayments,
    getCustomers
} from '../controllers/ordersController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getOrders);
router.get('/payments', protect, getPayments);
router.get('/customers', protect, getCustomers);
router.get('/:id', protect, getOrderById);
router.delete('/', protect, deleteOrders);

export default router;
