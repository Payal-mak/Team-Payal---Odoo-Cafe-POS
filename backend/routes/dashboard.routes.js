import express from 'express';
import { getDashboardStats, getRecentActivity, getReports } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/recent-activity', getRecentActivity);
router.get('/dashboard/reports', getReports);

export default router;
