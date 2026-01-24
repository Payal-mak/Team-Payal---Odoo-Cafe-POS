import express from 'express';
import {
    createPOSTerminal,
    getAllPOSTerminals,
    getPOSTerminal,
    deletePOSTerminal,
    updatePOSTerminalConfig
} from '../controllers/posTerminalController.js';
import { verifyToken, requireRole } from '../controllers/authController.js';

const router = express.Router();

// All routes require authentication and pos_user or admin role
// Kitchen users are forbidden from accessing POS terminals

router.post('/', verifyToken, requireRole('pos_user', 'admin'), createPOSTerminal);
router.get('/', verifyToken, requireRole('pos_user', 'admin'), getAllPOSTerminals);
router.get('/:id', verifyToken, requireRole('pos_user', 'admin'), getPOSTerminal);
router.delete('/:id', verifyToken, requireRole('pos_user', 'admin'), deletePOSTerminal);
router.patch('/:id/config', verifyToken, requireRole('pos_user', 'admin'), updatePOSTerminalConfig);

export default router;
