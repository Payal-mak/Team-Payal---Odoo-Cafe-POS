import express from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/recent-activity', getRecentActivity);

export default router;
