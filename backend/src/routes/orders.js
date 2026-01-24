import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to generate order number
const generateOrderNumber = async () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [rows] = await pool.query(
        'SELECT count(*) as count FROM orders WHERE DATE(created_at) = CURDATE()'
    );
    const count = rows[0].count + 1;
    return `ORD-${dateStr}-${String(count).padStart(4, '0')}`;
};

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const {
            session_id,
            table_id,
            total_amount,
            tax_amount,
            items, // Array of order lines
            payment_method = 'cash',
            customer_id = null
        } = req.body;

        if (!items || items.length === 0) {
            await connection.rollback();
            return res.status(400).json({ status: 'error', message: 'Order must contain items' });
        }

        const orderNumber = await generateOrderNumber();

        // 1. Create Order
        const [orderResult] = await connection.query(
            `INSERT INTO orders 
      (order_number, session_id, table_id, customer_id, total_amount, tax_amount, payment_status, payment_method, status, kitchen_stage) 
      VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, 'paid', 'to_cook')`,
            [orderNumber, session_id, table_id, customer_id, total_amount, tax_amount, payment_method]
        );

        const orderId = orderResult.insertId;

        // 2. Create Order Lines
        for (const item of items) {
            await connection.query(
                `INSERT INTO order_lines 
        (order_id, product_id, variant_id, quantity, unit_price, tax_rate, subtotal, total) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.product_id,
                    item.variant_id || null,
                    item.quantity,
                    item.unit_price,
                    item.tax_rate || 0,
                    item.subtotal,
                    item.total
                ]
            );
        }

        // Update active table status if table_id is provided?
        // Not strictly needed if "active" just means physically available. 
        // But maybe we want to mark it "Occupied". The schema has 'active' but that's for configuration.
        // For now, no table status update in DB needed unless we track 'occupied'.

        // Determine kitchen stage? defaults to 'to_cook'

        await connection.commit();

        // Fetch full order to return
        const [savedOrder] = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);

        res.status(201).json({
            status: 'success',
            message: 'Order created successfully',
            data: { order: savedOrder[0] }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * GET /api/orders/:id
 * Get order details
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Order not found' });
        }

        const [lines] = await pool.query(
            `SELECT ol.*, p.name as product_name, p.unit, v.value as variant_value, v.attribute_name
       FROM order_lines ol
       JOIN products p ON ol.product_id = p.id
       LEFT JOIN product_variants v ON ol.variant_id = v.id
       WHERE ol.order_id = ?`,
            [id]
        );

        res.json({
            status: 'success',
            data: {
                order: {
                    ...orders[0],
                    lines
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch order'
        });
    }
});

export default router;
