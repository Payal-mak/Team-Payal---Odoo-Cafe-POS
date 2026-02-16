const { promisePool } = require('../config/database');

// Get kitchen orders
exports.getKitchenOrders = async (req, res, next) => {
    try {
        const { kitchen_status } = req.query;

        let query = `
            SELECT 
                oi.*,
                o.order_number,
                o.order_date,
                t.table_number,
                f.name as floor_name
            FROM order_items oi
            LEFT JOIN orders o ON oi.order_id = o.id
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN floors f ON t.floor_id = f.id
            WHERE o.status IN ('sent_to_kitchen', 'preparing')
        `;
        const queryParams = [];

        if (kitchen_status) {
            query += ' AND oi.kitchen_status = ?';
            queryParams.push(kitchen_status);
        }

        query += ' ORDER BY oi.created_at ASC';

        const [items] = await promisePool.query(query, queryParams);
        res.status(200).json({ success: true, count: items.length, data: items });
    } catch (error) {
        next(error);
    }
};

// Update order status in kitchen
exports.updateKitchenOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Please provide status' });

        await promisePool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        const [orders] = await promisePool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);

        res.status(200).json({ success: true, message: 'Order status updated', data: orders[0] });
    } catch (error) {
        next(error);
    }
};

// Update item status in kitchen
exports.updateKitchenItemStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Please provide status' });

        await promisePool.query('UPDATE order_items SET kitchen_status = ? WHERE id = ?', [status, req.params.id]);

        // Check if all items are completed
        const [item] = await promisePool.query('SELECT order_id FROM order_items WHERE id = ?', [req.params.id]);
        const orderId = item[0].order_id;

        const [allItems] = await promisePool.query(
            'SELECT COUNT(*) as total, SUM(CASE WHEN kitchen_status = ? THEN 1 ELSE 0 END) as completed FROM order_items WHERE order_id = ?',
            ['completed', orderId]
        );

        if (allItems[0].total === allItems[0].completed) {
            await promisePool.query('UPDATE orders SET status = ? WHERE id = ?', ['completed', orderId]);
        }

        const [items] = await promisePool.query('SELECT * FROM order_items WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: 'Item status updated', data: items[0] });
    } catch (error) {
        next(error);
    }
};

// Get kitchen statistics
exports.getKitchenStats = async (req, res, next) => {
    try {
        const [stats] = await promisePool.query(`
            SELECT 
                kitchen_status,
                COUNT(*) as count
            FROM order_items oi
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.status IN ('sent_to_kitchen', 'preparing')
            GROUP BY kitchen_status
        `);

        const statsObj = {
            pending: 0,
            to_cook: 0,
            preparing: 0,
            completed: 0
        };

        stats.forEach(stat => {
            statsObj[stat.kitchen_status] = stat.count;
        });

        res.status(200).json({ success: true, data: statsObj });
    } catch (error) {
        next(error);
    }
};
