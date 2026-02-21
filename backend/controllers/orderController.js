const { promisePool } = require('../config/database');

// Get all orders
exports.getOrders = async (req, res, next) => {
    try {
        const { status, payment_status, session_id } = req.query;
        let query = `
            SELECT o.*, t.table_number, f.name as floor_name, c.name as customer_name, u.full_name as cashier_name
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN floors f ON t.floor_id = f.id
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN users u ON o.user_id = u.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (status) { query += ' AND o.status = ?'; queryParams.push(status); }
        if (payment_status) { query += ' AND o.payment_status = ?'; queryParams.push(payment_status); }
        if (session_id) { query += ' AND o.session_id = ?'; queryParams.push(session_id); }

        query += ' ORDER BY o.created_at DESC';

        const [orders] = await promisePool.query(query, queryParams);
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        next(error);
    }
};

// Create order
exports.createOrder = async (req, res, next) => {
    try {
        const { session_id, table_id, customer_id, items, notes } = req.body;

        if (!session_id || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide session_id and items' });
        }

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        for (const item of items) {
            const quantity = parseInt(item.quantity) || 1;
            const unit_price = parseFloat(item.unit_price || item.price) || 0;
            const tax_percentage = parseFloat(item.tax_percentage) || 0;

            const itemSubtotal = quantity * unit_price;
            const itemTax = (itemSubtotal * tax_percentage) / 100;
            subtotal += itemSubtotal;
            taxAmount += itemTax;
        }

        const totalAmount = subtotal + taxAmount;

        // Create order
        const [orderResult] = await promisePool.query(
            'INSERT INTO orders (order_number, session_id, table_id, customer_id, user_id, subtotal, tax_amount, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderNumber, session_id, table_id, customer_id, req.user.id, subtotal, taxAmount, totalAmount, notes]
        );

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of items) {
            const productName = item.product_name || item.name || null;
            const quantity = parseInt(item.quantity) || 1;
            const unit_price = parseFloat(item.unit_price) || 0;
            const tax_percentage = parseFloat(item.tax_percentage) || 0;

            if (!productName) {
                return res.status(400).json({
                    success: false,
                    message: `product_name is required for each item`
                });
            }

            if (isNaN(quantity) || isNaN(unit_price)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity or price for item: ${productName}`
                });
            }

            const itemSubtotal = quantity * unit_price;
            const itemTax = (itemSubtotal * tax_percentage) / 100;
            const itemTotal = itemSubtotal + itemTax;

            const [itemResult] = await promisePool.query(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, tax_amount, subtotal, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [orderId, item.product_id, productName, quantity, unit_price, itemTax, itemSubtotal, itemTotal, item.notes || null]
            );

            // Add variants if any
            if (item.variants && item.variants.length > 0) {
                for (const variant of item.variants) {
                    await promisePool.query(
                        'INSERT INTO order_item_variants (order_item_id, variant_id, attribute_name, attribute_value, extra_price) VALUES (?, ?, ?, ?, ?)',
                        [itemResult.insertId, variant.variant_id, variant.attribute_name, variant.attribute_value, variant.extra_price]
                    );
                }
            }
        }

        // Update table status if table is assigned
        if (table_id) {
            await promisePool.query('UPDATE tables SET status = ? WHERE id = ?', ['occupied', table_id]);
        }

        // Create kitchen ticket automatically
        const [kitchenTicket] = await promisePool.query(
            `INSERT INTO kitchen_tickets (order_id, status, created_at)
             VALUES (?, 'to_cook', NOW())`,
            [orderId]
        );

        // Also insert kitchen_ticket_items for each order item
        const [orderItems] = await promisePool.query(
            'SELECT * FROM order_items WHERE order_id = ?', [orderId]
        );
        for (const oi of orderItems) {
            await promisePool.query(
                `INSERT INTO kitchen_ticket_items
                 (ticket_id, order_item_id, product_name, quantity, prepared)
                 VALUES (?, ?, ?, ?, false)`,
                [kitchenTicket.insertId, oi.id, oi.product_name, oi.quantity]
            );
        }

        // Update order status to sent_to_kitchen
        await promisePool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['sent_to_kitchen', orderId]
        );

        const [orders] = await promisePool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        res.status(201).json({ success: true, message: 'Order created successfully', data: orders[0] });
    } catch (error) {
        next(error);
    }
};

// Get order details
exports.getOrder = async (req, res, next) => {
    try {
        const [orders] = await promisePool.query(`
            SELECT o.*, t.table_number, f.name as floor_name, c.name as customer_name, u.full_name as cashier_name
            FROM orders o
            LEFT JOIN tables t ON o.table_id = t.id
            LEFT JOIN floors f ON t.floor_id = f.id
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `, [req.params.id]);

        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });

        // Get order items
        const [items] = await promisePool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);

        // Get variants for each item
        for (const item of items) {
            const [variants] = await promisePool.query(
                'SELECT * FROM order_item_variants WHERE order_item_id = ?',
                [item.id]
            );
            item.variants = variants;
        }

        const order = orders[0];
        order.items = items;

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// Update order
exports.updateOrder = async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        const updateFields = [];
        const updateValues = [];

        if (status) { updateFields.push('status = ?'); updateValues.push(status); }
        if (notes !== undefined) { updateFields.push('notes = ?'); updateValues.push(notes); }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updateValues.push(req.params.id);
        await promisePool.query(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        const [orders] = await promisePool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);

        res.status(200).json({ success: true, message: 'Order updated successfully', data: orders[0] });
    } catch (error) {
        next(error);
    }
};

// Delete order (draft only)
exports.deleteOrder = async (req, res, next) => {
    try {
        const [orders] = await promisePool.query('SELECT status FROM orders WHERE id = ?', [req.params.id]);
        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
        if (orders[0].status !== 'draft') {
            return res.status(400).json({ success: false, message: 'Can only delete draft orders' });
        }

        await promisePool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: 'Order deleted successfully', data: {} });
    } catch (error) {
        next(error);
    }
};

// Send order to kitchen
exports.sendToKitchen = async (req, res, next) => {
    try {
        await promisePool.query('UPDATE orders SET status = ? WHERE id = ?', ['sent_to_kitchen', req.params.id]);
        await promisePool.query('UPDATE order_items SET kitchen_status = ? WHERE order_id = ?', ['to_cook', req.params.id]);

        const [orders] = await promisePool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: 'Order sent to kitchen', data: orders[0] });
    } catch (error) {
        next(error);
    }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
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

// Get orders by table
exports.getOrdersByTable = async (req, res, next) => {
    try {
        const [orders] = await promisePool.query(`
            SELECT o.* FROM orders o
            WHERE o.table_id = ? AND o.payment_status != 'paid'
            ORDER BY o.created_at DESC
        `, [req.params.tableId]);

        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        next(error);
    }
};
