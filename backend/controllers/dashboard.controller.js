import { query } from '../config/database.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Get products count
        const productsResult = await query('SELECT COUNT(*) as total FROM products');
        const productsCount = productsResult[0].total;

        // Get categories count
        const categoriesResult = await query('SELECT COUNT(*) as total FROM categories');
        const categoriesCount = categoriesResult[0].total;

        // Get floors count
        const floorsResult = await query('SELECT COUNT(*) as total FROM floors');
        const floorsCount = floorsResult[0].total;

        // Get tables count
        const tablesResult = await query('SELECT COUNT(*) as total FROM `tables`');
        const tablesCount = tablesResult[0].total;

        // Get active tables count
        const activeTablesResult = await query('SELECT COUNT(*) as total FROM `tables` WHERE active = 1');
        const activeTablesCount = activeTablesResult[0].total;

        // Get current active session (if any)
        const activeSessionResult = await query(`
            SELECT 
                ps.id,
                ps.open_date,
                ps.sale_amount,
                pc.name as pos_name,
                u.username as responsible
            FROM pos_sessions ps
            LEFT JOIN pos_configs pc ON ps.pos_config_id = pc.id
            LEFT JOIN users u ON ps.responsible_user_id = u.id
            WHERE ps.status = 'open'
            ORDER BY ps.open_date DESC
            LIMIT 1
        `);
        const activeSession = activeSessionResult.length > 0 ? activeSessionResult[0] : null;

        // Get total orders count
        const ordersResult = await query('SELECT COUNT(*) as total FROM orders');
        const ordersCount = ordersResult[0].total;

        // Get today's orders
        const todayOrdersResult = await query(`
            SELECT COUNT(*) as total 
            FROM orders 
            WHERE DATE(created_at) = CURDATE()
        `);
        const todayOrdersCount = todayOrdersResult[0].total;

        // Get today's revenue
        const todayRevenueResult = await query(`
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM orders 
            WHERE DATE(created_at) = CURDATE() AND status = 'paid'
        `);
        const todayRevenue = todayRevenueResult[0].revenue;

        res.json({
            success: true,
            data: {
                products: {
                    total: productsCount,
                    categories: categoriesCount
                },
                floors: {
                    total: floorsCount,
                    tables: tablesCount,
                    activeTables: activeTablesCount
                },
                session: activeSession,
                orders: {
                    total: ordersCount,
                    today: todayOrdersCount
                },
                revenue: {
                    today: parseFloat(todayRevenue)
                }
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
};

// Get recent activity (latest orders)
export const getRecentActivity = async (req, res) => {
    try {
        const limit = req.query.limit || 10;

        const recentOrders = await query(`
            SELECT 
                o.id,
                o.order_number,
                o.date,
                o.total_amount,
                o.status,
                o.payment_status,
                t.number as table_number,
                f.name as floor_name
            FROM orders o
            LEFT JOIN \`tables\` t ON o.table_id = t.id
            LEFT JOIN floors f ON t.floor_id = f.id
            ORDER BY o.created_at DESC
            LIMIT ?
        `, [parseInt(limit)]);

        res.json({
            success: true,
            data: recentOrders
        });
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activity'
        });
    }
};
