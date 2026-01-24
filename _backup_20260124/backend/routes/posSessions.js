import express from 'express';
import {
    openSession,
    closeSession,
    getCurrentSession,
    getTerminalSessions
} from '../controllers/posSessionController.js';
import { verifyToken, requireRole } from '../controllers/authController.js';

const router = express.Router();

// All routes require authentication and pos_user or admin role
// Kitchen users are forbidden from managing sessions

router.post('/open', verifyToken, requireRole('pos_user', 'admin'), openSession);
router.post('/close', verifyToken, requireRole('pos_user', 'admin'), closeSession);
router.get('/current/:terminalId', verifyToken, requireRole('pos_user', 'admin'), getCurrentSession);
router.get('/terminal/:terminalId', verifyToken, requireRole('pos_user', 'admin'), getTerminalSessions);

export default router;
