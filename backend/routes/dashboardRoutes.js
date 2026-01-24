import express from 'express';
import { getDashboardData, createTerminal } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getDashboardData);
router.post('/terminal', protect, createTerminal);

export default router;
