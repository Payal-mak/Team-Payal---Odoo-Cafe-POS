const { promisePool } = require('../config/database');

// Get kitchen orders
exports.getKitchenOrders = async (req, res, next) => {
    try {
        const { stage } = req.query;

        let query = `
            SELECT
                kt.id,
                kt.order_id,
                kt.status as stage,
                kt.created_at,
                o.order_number,
                o.order_type,
                o.notes,
                o.table_id,
                t.table_number as table_name,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', kti.id,
                        'product_name', kti.product_name,
                        'quantity', kti.quantity,
                        'status', CASE WHEN kti.prepared = 1 THEN 'ready' ELSE 'pending' END
                    )
                ) as items
            FROM kitchen_tickets kt
            JOIN orders o ON kt.order_id = o.id
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN kitchen_ticket_items kti ON kti.ticket_id = kt.id
        `;
        const queryParams = [];

        if (stage) {
            query += ' WHERE kt.status = ?';
            queryParams.push(stage);
        } else {
            query += ` WHERE kt.status != 'completed' OR (kt.updated_at IS NOT NULL AND kt.updated_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE))`;
        }

        query += ' GROUP BY kt.id ORDER BY kt.created_at ASC';

        const [tickets] = await promisePool.query(query, queryParams);

        // Parse items JSON string if needed depending on MySQL driver
        const parsed = tickets.map(t => ({
            ...t,
            items: typeof t.items === 'string' ? JSON.parse(t.items) : t.items,
            status: t.stage
        }));

        res.status(200).json({ success: true, count: parsed.length, data: parsed });
    } catch (error) {
        next(error);
    }
};

// Update order status in kitchen
exports.updateKitchenOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Please provide status' });

        await promisePool.query('UPDATE kitchen_tickets SET status = ? WHERE id = ?', [status, req.params.id]);

        // If completed, also update the parent order status
        if (status === 'completed') {
            const [ticket] = await promisePool.query('SELECT order_id FROM kitchen_tickets WHERE id = ?', [req.params.id]);
            if (ticket.length > 0) {
                await promisePool.query(
                    'UPDATE orders SET status = ? WHERE id = ?',
                    ['completed', ticket[0].order_id]
                );
            }
        }

        res.status(200).json({ success: true, message: 'Order status updated' });
    } catch (error) {
        next(error);
    }
};

// Update item status in kitchen
exports.updateKitchenItemStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Please provide status' });

        const prepared = status === 'ready' ? 1 : 0;
        await promisePool.query('UPDATE kitchen_ticket_items SET prepared = ? WHERE id = ?', [prepared, req.params.id]);

        res.status(200).json({ success: true, message: 'Item status updated' });
    } catch (error) {
        next(error);
    }
};

// Get kitchen statistics
exports.getKitchenStats = async (req, res, next) => {
    try {
        const [stats] = await promisePool.query(`
            SELECT 
                status as kitchen_status,
                COUNT(*) as count
            FROM kitchen_tickets
            GROUP BY status
        `);

        const statsObj = {
            to_cook: 0,
            preparing: 0,
            completed: 0
        };

        stats.forEach(stat => {
            if (statsObj[stat.kitchen_status] !== undefined) {
                statsObj[stat.kitchen_status] = stat.count;
            }
        });

        res.status(200).json({ success: true, data: statsObj });
    } catch (error) {
        next(error);
    }
};
