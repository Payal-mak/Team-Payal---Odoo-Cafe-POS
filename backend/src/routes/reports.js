import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/reports/dashboard
 * Get aggregated dashboard statistics
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        // 1. Total Revenue (Paid Orders)
        const [revenueResult] = await pool.query(
            `SELECT SUM(total_amount) as revenue 
             FROM orders 
             WHERE status = 'paid'`
        );
        const revenue = revenueResult[0].revenue || 0;

        // 2. Total Orders (Paid Orders)
        const [ordersResult] = await pool.query(
            `SELECT COUNT(*) as count 
             FROM orders 
             WHERE status = 'paid'`
        );
        const totalOrders = ordersResult[0].count || 0;

        // 3. Top 5 Selling Products
        const [topProducts] = await pool.query(
            `SELECT p.name, SUM(ol.quantity) as quantity_sold 
             FROM order_lines ol 
             JOIN orders o ON ol.order_id = o.id 
             JOIN products p ON ol.product_id = p.id 
             WHERE o.status = 'paid' 
             GROUP BY p.id, p.name 
             ORDER BY quantity_sold DESC 
             LIMIT 5`
        );

        // 4. Recent Orders (Last 5)
        const [recentOrders] = await pool.query(
            `SELECT id, order_number, total_amount, status, created_at 
             FROM orders 
             ORDER BY created_at DESC 
             LIMIT 5`
        );

        res.json({
            status: 'success',
            data: {
                revenue,
                totalOrders,
                topProducts,
                recentOrders
            }
        });

    } catch (error) {
        console.error('Dashboard Report Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard stats' });
    }
});

export default router;
