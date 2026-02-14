import { query } from '../config/database.js';

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
    try {
        const orders = await query(
            `SELECT o.*, 
       c.name as customer_name,
       ps.id as session_id,
       t.number as table_number
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN pos_sessions ps ON o.session_id = ps.id
       LEFT JOIN \`tables\` t ON o.table_id = t.id
       ORDER BY o.created_at DESC`
        );

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const orders = await query(
            `SELECT o.*, 
       c.name as customer_name,
       ps.id as session_id,
       t.number as table_number
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN pos_sessions ps ON o.session_id = ps.id
       LEFT JOIN \`tables\` t ON o.table_id = t.id
       WHERE o.id = ?`,
            [id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Get order lines
        const orderLines = await query(
            `SELECT ol.*, 
       p.name as product_name,
       p.unit,
       pv.attribute_name,
       pv.value as variant_value
       FROM order_lines ol
       JOIN products p ON ol.product_id = p.id
       LEFT JOIN product_variants pv ON ol.variant_id = pv.id
       WHERE ol.order_id = ?`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...orders[0],
                items: orderLines
            }
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// @desc    Delete orders
// @route   DELETE /api/orders
// @access  Private
export const deleteOrders = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide order IDs to delete'
            });
        }

        // Only allow deleting draft orders
        const placeholders = ids.map(() => '?').join(',');
        await query(
            `DELETE FROM orders WHERE id IN (${placeholders}) AND status = 'draft'`,
            ids
        );

        res.json({
            success: true,
            message: 'Orders deleted successfully'
        });
    } catch (error) {
        console.error('Delete orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting orders',
            error: error.message
        });
    }
};

// @desc    Get payments
// @route   GET /api/orders/payments
// @access  Private
export const getPayments = async (req, res) => {
    try {
        const payments = await query(
            `SELECT o.id, o.order_number, o.date, o.total_amount, 
       o.payment_method, o.payment_status,
       c.name as customer_name,
       ps.id as session_id
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN pos_sessions ps ON o.session_id = ps.id
       WHERE o.status = 'paid'
       ORDER BY o.date DESC`
        );

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
};

// @desc    Get customers
// @route   GET /api/orders/customers
// @access  Private
export const getCustomers = async (req, res) => {
    try {
        const customers = await query(
            `SELECT c.*, 
       COUNT(o.id) as total_orders,
       SUM(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE 0 END) as total_spent
       FROM customers c
       LEFT JOIN orders o ON c.id = o.customer_id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
        );

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers',
            error: error.message
        });
    }
};
