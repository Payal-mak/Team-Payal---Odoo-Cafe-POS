import express from 'express';
import {
    signup,
    login,
    verifyToken,
    getCurrentUser,
    getAllUsers,
    updateUserRole,
    requireRole
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

// Admin-only routes
router.get('/users', verifyToken, requireRole('admin'), getAllUsers);
router.patch('/users/:id/role', verifyToken, requireRole('admin'), updateUserRole);

export default router;
