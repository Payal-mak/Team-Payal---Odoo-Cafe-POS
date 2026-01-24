import { query } from '../config/database.js';

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
export const getDashboardData = async (req, res) => {
    try {
        // Get POS terminals
        const terminals = await query(
            `SELECT pc.*, ps.open_date, ps.sale_amount 
       FROM pos_configs pc 
       LEFT JOIN pos_sessions ps ON pc.last_open_session_id = ps.id
       ORDER BY pc.created_at DESC`
        );

        // Get total orders count
        const orderStats = await query(
            `SELECT COUNT(*) as total_orders, 
       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
       SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_orders
       FROM orders`
        );

        // Get total revenue
        const revenueStats = await query(
            `SELECT SUM(total_amount) as total_revenue 
       FROM orders 
       WHERE status = 'paid'`
        );

        // Get products count
        const productStats = await query(
            `SELECT COUNT(*) as total_products FROM products`
        );

        res.json({
            success: true,
            data: {
                terminals: terminals || [],
                stats: {
                    totalOrders: orderStats[0]?.total_orders || 0,
                    paidOrders: orderStats[0]?.paid_orders || 0,
                    draftOrders: orderStats[0]?.draft_orders || 0,
                    totalRevenue: revenueStats[0]?.total_revenue || 0,
                    totalProducts: productStats[0]?.total_products || 0
                }
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

// @desc    Create new POS terminal
// @route   POST /api/dashboard/terminal
// @access  Private
export const createTerminal = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Terminal name is required'
            });
        }

        const result = await query(
            'INSERT INTO pos_configs (name) VALUES (?)',
            [name]
        );

        res.status(201).json({
            success: true,
            message: 'Terminal created successfully',
            terminal: {
                id: result.insertId,
                name
            }
        });
    } catch (error) {
        console.error('Create terminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating terminal',
            error: error.message
        });
    }
};
