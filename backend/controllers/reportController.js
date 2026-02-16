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
            WHERE DATE(order_date) = CURDATE() AND status != 'cancelled'
        `);

        // Active orders
        const [activeOrders] = await promisePool.query(`
            SELECT COUNT(*) as count
            FROM orders
            WHERE status IN ('draft', 'sent_to_kitchen', 'preparing', 'completed') AND payment_status != 'paid'
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
            WHERE DATE(o.order_date) = CURDATE() AND o.status != 'cancelled'
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
