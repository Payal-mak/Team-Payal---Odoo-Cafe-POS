import express from 'express';
import { getDashboardData, createTerminal, updatePosConfig, getTerminalConfig, openSession } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getDashboardData);
router.post('/terminal', protect, createTerminal);
router.get('/terminal/:id', protect, getTerminalConfig);
router.put('/terminal/:id/config', protect, updatePosConfig);
router.post('/terminal/:id/session', protect, openSession);

export default router;
