const { promisePool } = require('../config/database');

// Get dashboard stats
exports.getDashboardStats = async (req, res, next) => {
    try {
        // Today's sales
        const [todaySales] = await promisePool.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COALESCE(SUM(subtotal), 0) as subtotal,
                COALESCE(SUM(tax_amount), 0) as tax_amount
            FROM orders
            WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled', 'draft')
        `);

        // Active orders
        const [activeOrders] = await promisePool.query(`
            SELECT COUNT(*) as count
            FROM orders
            WHERE status IN ('sent_to_kitchen', 'preparing')
        `);

        // Occupied tables
        const [occupiedTables] = await promisePool.query(`
            SELECT COUNT(*) as count FROM tables WHERE status = 'occupied'
        `);

        // Total tables
        const [totalTables] = await promisePool.query(`
            SELECT COUNT(*) as count FROM tables WHERE is_active = 1
        `);

        // Active sessions
        const [activeSessions] = await promisePool.query(`
            SELECT COUNT(*) as count FROM pos_sessions WHERE status = 'open'
        `);

        // Top selling products today
        const [topProducts] = await promisePool.query(`
            SELECT 
                p.name,
                SUM(oi.quantity) as quantity_sold,
                SUM(oi.total) as revenue
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE DATE(o.created_at) = CURDATE() AND o.status NOT IN ('cancelled', 'draft')
            GROUP BY p.id, p.name
            ORDER BY quantity_sold DESC
            LIMIT 5
        `);

        res.status(200).json({
            success: true,
            data: {
                today_sales: todaySales[0],
                active_orders: activeOrders[0].count,
                occupied_tables: occupiedTables[0].count,
                total_tables: totalTables[0].count,
                active_sessions: activeSessions[0].count,
                top_products: topProducts
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get sales report
exports.getSalesReport = async (req, res, next) => {
    try {
        const { start_date, end_date, group_by } = req.query;

        let query = `
            SELECT 
                DATE(order_date) as date,
                COUNT(*) as total_orders,
                SUM(subtotal) as subtotal,
                SUM(tax_amount) as tax_amount,
                SUM(total_amount) as total_revenue
            FROM orders
            WHERE status != 'cancelled'
        `;
        const queryParams = [];

        if (start_date) {
            query += ' AND DATE(order_date) >= ?';
            queryParams.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(order_date) <= ?';
            queryParams.push(end_date);
        }

        if (group_by === 'month') {
            query = query.replace('DATE(order_date) as date', 'DATE_FORMAT(order_date, "%Y-%m") as date');
        } else if (group_by === 'year') {
            query = query.replace('DATE(order_date) as date', 'YEAR(order_date) as date');
        }

        query += ' GROUP BY date ORDER BY date DESC';

        const [sales] = await promisePool.query(query, queryParams);

        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (error) {
        next(error);
    }
};

// Get top selling products
exports.getTopProducts = async (req, res, next) => {
    try {
        const { start_date, end_date, limit } = req.query;

        let query = `
            SELECT 
                p.id,
                p.name,
                c.name as category_name,
                SUM(oi.quantity) as quantity_sold,
                SUM(oi.total) as total_revenue,
                COUNT(DISTINCT oi.order_id) as times_ordered
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
        `;
        const queryParams = [];

        if (start_date) {
            query += ' AND DATE(o.order_date) >= ?';
            queryParams.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(o.order_date) <= ?';
            queryParams.push(end_date);
        }

        query += ' GROUP BY p.id, p.name, c.name ORDER BY quantity_sold DESC';

        if (limit) {
            query += ' LIMIT ?';
            queryParams.push(parseInt(limit));
        }

        const [products] = await promisePool.query(query, queryParams);

        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        next(error);
    }
};

// Get top categories
exports.getTopCategories = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                c.id,
                c.name,
                c.color,
                SUM(oi.quantity) as quantity_sold,
                SUM(oi.total) as total_revenue,
                COUNT(DISTINCT oi.order_id) as times_ordered
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
        `;
        const queryParams = [];

        if (start_date) {
            query += ' AND DATE(o.order_date) >= ?';
            queryParams.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(o.order_date) <= ?';
            queryParams.push(end_date);
        }

        query += ' GROUP BY c.id, c.name, c.color ORDER BY total_revenue DESC';

        const [categories] = await promisePool.query(query, queryParams);

        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        next(error);
    }
};

// Export report (placeholder - would integrate with PDF/Excel library)
exports.exportReport = async (req, res, next) => {
    try {
        const { format, report_type, start_date, end_date } = req.body;

        // This is a placeholder - in production, you would use libraries like:
        // - pdfkit or puppeteer for PDF
        // - exceljs for Excel

        res.status(200).json({
            success: true,
            message: 'Report export feature - integrate with PDF/Excel library',
            data: {
                format,
                report_type,
                start_date,
                end_date
            }
        });
    } catch (error) {
        next(error);
    }
};

// Advanced reporting endpoint for the customized Reports Page
exports.getAdvancedReports = async (req, res, next) => {
    try {
        const { duration = 'Today' } = req.query;
        let dateFilter = '';
        let dateFilterPrev = '';
        let groupByFormat = '%H:00'; // Default hourly for today

        if (duration === 'Today') {
            dateFilter = 'DATE(o.created_at) = CURDATE()';
            dateFilterPrev = 'DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
            groupByFormat = '%H:00';
        } else if (duration === 'Weekly') {
            dateFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            dateFilterPrev = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND o.created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            groupByFormat = '%Y-%m-%d';
        } else if (duration === 'Monthly') {
            dateFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            dateFilterPrev = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND o.created_at < DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            groupByFormat = '%Y-%m-%d';
        } else if (duration === '365 Days') {
            dateFilter = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
            dateFilterPrev = 'o.created_at >= DATE_SUB(CURDATE(), INTERVAL 730 DAY) AND o.created_at < DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
            groupByFormat = '%Y-%m';
        } else {
            // Default to today
            dateFilter = 'DATE(o.created_at) = CURDATE()';
            dateFilterPrev = 'DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
        }

        const statusFilter = `o.status IN ('paid', 'completed')`;

        // Summary queries current
        const [currentStats] = await promisePool.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as revenue
            FROM orders o
            WHERE ${dateFilter} AND ${statusFilter}
        `);

        // Summary queries prior
        const [prevStats] = await promisePool.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as revenue
            FROM orders o
            WHERE ${dateFilterPrev} AND ${statusFilter}
        `);

        // Sales Graph
        const [salesGraph] = await promisePool.query(`
            SELECT 
                DATE_FORMAT(o.created_at, '${groupByFormat}') as time,
                COALESCE(SUM(o.total_amount), 0) as revenue
            FROM orders o
            WHERE ${dateFilter} AND ${statusFilter}
            GROUP BY time
            ORDER BY MIN(o.created_at) ASC
        `);

        // Top Category Pie Chart
        const [topCategories] = await promisePool.query(`
            SELECT 
                c.name,
                COALESCE(SUM(oi.total), 0) as revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE ${dateFilter} AND ${statusFilter}
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
            LIMIT 10
        `);

        // Top Orders Table
        const [topOrders] = await promisePool.query(`
            SELECT 
                o.created_at as Date,
                o.session_id as Session,
                o.total_amount as Total,
                SUM(oi.quantity) as Qty,
                COALESCE(cu.name, 'Walk-in') as Customer
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN customers cu ON o.customer_id = cu.id
            WHERE ${dateFilter} AND ${statusFilter}
            GROUP BY o.id, o.created_at, o.session_id, o.total_amount, cu.name
            ORDER BY o.total_amount DESC
            LIMIT 10
        `);

        // Top Product Table
        const [topProduct] = await promisePool.query(`
            SELECT 
                p.name as Product,
                SUM(oi.quantity) as Qty,
                COALESCE(SUM(oi.total), 0) as Revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE ${dateFilter} AND ${statusFilter}
            GROUP BY p.id, p.name
            ORDER BY Revenue DESC
            LIMIT 10
        `);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    current: currentStats[0],
                    previous: prevStats[0]
                },
                salesData: salesGraph,
                topCategories: topCategories,
                topOrders: topOrders,
                topProduct: topProduct
            }
        });

    } catch (error) {
        next(error);
    }
};
