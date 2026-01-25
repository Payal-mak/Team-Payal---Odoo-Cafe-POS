import { query } from '../config/database.js';

// Generate unique order number
const generateOrderNumber = async () => {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get the count of orders today for numbering
    const result = await query(
        `SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()`
    );

    const orderCount = (result[0]?.count || 0) + 1;
    return `ORD-${datePrefix}-${String(orderCount).padStart(4, '0')}`;
};

// Create a new order
export const createOrder = async (req, res) => {
    try {
        const { table_id, session_id, items, notes, customer_name } = req.body;

        // Validation
        if (!table_id || !session_id || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Table ID, Session ID, and items are required'
            });
        }

        // Generate order number
        const orderNumber = await generateOrderNumber();

        // Calculate initial totals (will be recalculated after order lines are inserted)
        let subtotal = 0;
        items.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        const estimatedTaxAmount = subtotal * 0.1; // Estimate, will be recalculated
        const estimatedTotalAmount = subtotal + estimatedTaxAmount;

        // Insert the order
        const orderResult = await query(
            `INSERT INTO orders (
                order_number, session_id, table_id, customer_name, 
                status, kitchen_stage, total_amount, tax_amount, 
                payment_status, notes
            ) VALUES (?, ?, ?, ?, 'draft', 'to_cook', ?, ?, 'unpaid', ?)`,
            [orderNumber, session_id, table_id, customer_name || null, estimatedTotalAmount, estimatedTaxAmount, notes || null]
        );

        const orderId = orderResult.insertId;

        // Insert order lines
        for (const item of items) {
            // Get product tax rate from database
            const productResult = await query('SELECT tax_rate FROM products WHERE id = ?', [item.id]);
            const productTaxRate = productResult.length > 0 ? productResult[0].tax_rate : (item.tax_rate || 10);
            const taxRateDecimal = productTaxRate / 100; // Convert percentage to decimal

            const lineSubtotal = item.price * item.quantity;
            const lineTax = lineSubtotal * taxRateDecimal;
            const lineTotal = lineSubtotal + lineTax;

            await query(
                `INSERT INTO order_lines (
                    order_id, product_id, quantity, unit_price, 
                    tax_rate, subtotal, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.id, item.quantity, item.price, productTaxRate, lineSubtotal, lineTotal]
            );
        }

        // Recalculate order totals from order lines (in case of rounding differences)
        const recalculatedTotals = await query(`
            SELECT 
                COALESCE(SUM(subtotal), 0) as subtotal,
                COALESCE(SUM(total - subtotal), 0) as tax_amount,
                COALESCE(SUM(total), 0) as total_amount
            FROM order_lines
            WHERE order_id = ?
        `, [orderId]);

        if (recalculatedTotals.length > 0) {
            await query(`
                UPDATE orders 
                SET total_amount = ?, tax_amount = ?
                WHERE id = ?
            `, [
                recalculatedTotals[0].total_amount,
                recalculatedTotals[0].tax_amount,
                orderId
            ]);
        }

        // Get the complete order with lines
        const order = await getOrderWithLines(orderId);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
};

// Get order by ID with lines
const getOrderWithLines = async (orderId) => {
    const orders = await query(`
        SELECT 
            o.*,
            t.number as table_number,
            f.name as floor_name,
            ps.id as session_id
        FROM orders o
        LEFT JOIN \`tables\` t ON o.table_id = t.id
        LEFT JOIN floors f ON t.floor_id = f.id
        LEFT JOIN pos_sessions ps ON o.session_id = ps.id
        WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) return null;

    const order = orders[0];

    // Get order lines
    const lines = await query(`
        SELECT 
            ol.*,
            p.name as product_name,
            c.name as category_name
        FROM order_lines ol
        LEFT JOIN products p ON ol.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE ol.order_id = ?
    `, [orderId]);

    return { ...order, lines };
};

// Get order by ID (API endpoint)
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await getOrderWithLines(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order'
        });
    }
};

// Get all orders (with optional filters)
export const getAllOrders = async (req, res) => {
    try {
        const { session_id, table_id, status, kitchen_stage, limit = 50 } = req.query;

        let sql = `
            SELECT 
                o.*,
                t.number as table_number,
                f.name as floor_name
            FROM orders o
            LEFT JOIN \`tables\` t ON o.table_id = t.id
            LEFT JOIN floors f ON t.floor_id = f.id
            WHERE 1=1
        `;
        const params = [];

        if (session_id) {
            sql += ' AND o.session_id = ?';
            params.push(session_id);
        }
        if (table_id) {
            sql += ' AND o.table_id = ?';
            params.push(table_id);
        }
        if (status) {
            sql += ' AND o.status = ?';
            params.push(status);
        }
        if (kitchen_stage) {
            sql += ' AND o.kitchen_stage = ?';
            params.push(kitchen_stage);
        }

        sql += ' ORDER BY o.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const orders = await query(sql, params);

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};

// Get orders by table (for current session)
export const getOrdersByTable = async (req, res) => {
    try {
        const { tableId } = req.params;
        const { session_id } = req.query;

        let sql = `
            SELECT 
                o.*,
                t.number as table_number
            FROM orders o
            LEFT JOIN \`tables\` t ON o.table_id = t.id
            WHERE o.table_id = ?
        `;
        const params = [tableId];

        if (session_id) {
            sql += ' AND o.session_id = ?';
            params.push(session_id);
        }

        sql += ' ORDER BY o.created_at DESC';

        const orders = await query(sql, params);

        // Get lines for each order
        const ordersWithLines = await Promise.all(
            orders.map(async (order) => {
                const lines = await query(`
                    SELECT ol.*, p.name as product_name
                    FROM order_lines ol
                    LEFT JOIN products p ON ol.product_id = p.id
                    WHERE ol.order_id = ?
                `, [order.id]);
                return { ...order, lines };
            })
        );

        res.json({
            success: true,
            data: ordersWithLines
        });
    } catch (error) {
        console.error('Get orders by table error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};

// Update order status (for kitchen/payment)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, kitchen_stage, payment_status, payment_method } = req.body;

        const existing = await query('SELECT id FROM orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const updates = [];
        const params = [];

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (kitchen_stage) {
            updates.push('kitchen_stage = ?');
            params.push(kitchen_stage);
        }
        if (payment_status) {
            updates.push('payment_status = ?');
            params.push(payment_status);
        }
        if (payment_method) {
            updates.push('payment_method = ?');
            params.push(payment_method);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No updates provided'
            });
        }

        params.push(id);
        await query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);

        const order = await getOrderWithLines(id);

        res.json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order'
        });
    }
};

// Send order to kitchen
export const sendToKitchen = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query('SELECT id, kitchen_stage FROM orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Set to 'to_cook' when first sent to kitchen
        await query(
            `UPDATE orders SET kitchen_stage = 'to_cook' WHERE id = ?`,
            [id]
        );

        const order = await getOrderWithLines(id);

        res.json({
            success: true,
            message: 'Order sent to kitchen',
            data: order
        });
    } catch (error) {
        console.error('Send to kitchen error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send order to kitchen'
        });
    }
};

// Update kitchen stage (to_cook -> preparing -> completed)
export const updateKitchenStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;

        if (!['to_cook', 'preparing', 'completed'].includes(stage)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid stage. Must be: to_cook, preparing, or completed'
            });
        }

        const existing = await query('SELECT id FROM orders WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        await query(
            `UPDATE orders SET kitchen_stage = ? WHERE id = ?`,
            [stage, id]
        );

        const order = await getOrderWithLines(id);

        res.json({
            success: true,
            message: 'Kitchen stage updated',
            data: order
        });
    } catch (error) {
        console.error('Update kitchen stage error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update kitchen stage'
        });
    }
};

// Mark order line item as prepared
export const markItemPrepared = async (req, res) => {
    try {
        const { orderId, lineId } = req.params;

        const existingLine = await query('SELECT id FROM order_lines WHERE id = ? AND order_id = ?', [lineId, orderId]);
        if (existingLine.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order line not found'
            });
        }

        await query(
            `UPDATE order_lines SET is_prepared = 1 WHERE id = ?`,
            [lineId]
        );

        // Check if all items are prepared, then auto-advance to completed
        const allItems = await query('SELECT is_prepared FROM order_lines WHERE order_id = ?', [orderId]);
        const allPrepared = allItems.every(item => item.is_prepared === 1);
        
        if (allPrepared) {
            await query('UPDATE orders SET kitchen_stage = ? WHERE id = ?', ['completed', orderId]);
        }

        const order = await getOrderWithLines(orderId);

        res.json({
            success: true,
            message: 'Item marked as prepared',
            data: order
        });
    } catch (error) {
        console.error('Mark item prepared error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark item as prepared'
        });
    }
};
