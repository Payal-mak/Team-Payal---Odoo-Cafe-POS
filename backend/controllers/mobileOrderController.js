const { promisePool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Generate QR token for table
exports.generateToken = async (req, res, next) => {
    try {
        const { table_id } = req.body;
        if (!table_id) return res.status(400).json({ success: false, message: 'Please provide table_id' });

        // Check if table exists
        const [tables] = await promisePool.query('SELECT * FROM tables WHERE id = ?', [table_id]);
        if (tables.length === 0) return res.status(404).json({ success: false, message: 'Table not found' });

        // Generate unique token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create mobile order entry
        const [result] = await promisePool.query(
            'INSERT INTO mobile_orders (token, table_id, expires_at) VALUES (?, ?, ?)',
            [token, table_id, expiresAt]
        );

        const [mobileOrders] = await promisePool.query('SELECT * FROM mobile_orders WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'QR token generated successfully',
            data: {
                ...mobileOrders[0],
                qr_url: `${req.protocol}://${req.get('host')}/mobile/${token}`
            }
        });
    } catch (error) {
        next(error);
    }
};

// Verify token and get table info
exports.verifyToken = async (req, res, next) => {
    try {
        const [mobileOrders] = await promisePool.query(`
            SELECT mo.*, t.table_number, t.seats, f.name as floor_name
            FROM mobile_orders mo
            LEFT JOIN tables t ON mo.table_id = t.id
            LEFT JOIN floors f ON t.floor_id = f.id
            WHERE mo.token = ? AND mo.status = 'active' AND mo.expires_at > NOW()
        `, [req.params.token]);

        if (mobileOrders.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid or expired token' });
        }

        res.status(200).json({ success: true, data: mobileOrders[0] });
    } catch (error) {
        next(error);
    }
};

// Place order via mobile
exports.placeOrder = async (req, res, next) => {
    try {
        const { items, customer_name, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide items' });
        }

        // Verify token
        const [mobileOrders] = await promisePool.query(
            'SELECT * FROM mobile_orders WHERE token = ? AND status = ? AND expires_at > NOW()',
            [req.params.token, 'active']
        );

        if (mobileOrders.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid or expired token' });
        }

        const mobileOrder = mobileOrders[0];

        // Get or create customer
        let customerId = null;
        if (customer_name) {
            const [customers] = await promisePool.query(
                'SELECT id FROM customers WHERE name = ?',
                [customer_name]
            );
            if (customers.length > 0) {
                customerId = customers[0].id;
            } else {
                const [result] = await promisePool.query(
                    'INSERT INTO customers (name) VALUES (?)',
                    [customer_name]
                );
                customerId = result.insertId;
            }
        }

        // Get active session (use first available)
        const [sessions] = await promisePool.query(
            'SELECT id FROM pos_sessions WHERE status = ? LIMIT 1',
            ['open']
        );

        if (sessions.length === 0) {
            return res.status(400).json({ success: false, message: 'No active POS session available' });
        }

        // Generate order number
        const orderNumber = `MOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        for (const item of items) {
            const itemSubtotal = item.quantity * item.unit_price;
            const itemTax = (itemSubtotal * (item.tax_percentage || 0)) / 100;
            subtotal += itemSubtotal;
            taxAmount += itemTax;
        }

        const totalAmount = subtotal + taxAmount;

        // Create order
        const [orderResult] = await promisePool.query(
            'INSERT INTO orders (order_number, session_id, table_id, customer_id, user_id, subtotal, tax_amount, total_amount, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderNumber, sessions[0].id, mobileOrder.table_id, customerId, 1, subtotal, taxAmount, totalAmount, notes, 'sent_to_kitchen']
        );

        const orderId = orderResult.insertId;

        // Create order items
        for (const item of items) {
            const itemSubtotal = item.quantity * item.unit_price;
            const itemTax = (itemSubtotal * (item.tax_percentage || 0)) / 100;
            const itemTotal = itemSubtotal + itemTax;

            await promisePool.query(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, tax_amount, subtotal, total, kitchen_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, itemTax, itemSubtotal, itemTotal, 'to_cook']
            );
        }

        // Update mobile order
        await promisePool.query(
            'UPDATE mobile_orders SET order_id = ? WHERE id = ?',
            [orderId, mobileOrder.id]
        );

        // Update table status
        await promisePool.query('UPDATE tables SET status = ? WHERE id = ?', ['occupied', mobileOrder.table_id]);

        const [orders] = await promisePool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        res.status(201).json({ success: true, message: 'Order placed successfully', data: orders[0] });
    } catch (error) {
        next(error);
    }
};

// Get menu for QR code
exports.getMenu = async (req, res, next) => {
    try {
        // Verify token first
        const [mobileOrders] = await promisePool.query(
            'SELECT * FROM mobile_orders WHERE token = ? AND status = ? AND expires_at > NOW()',
            [req.params.token, 'active']
        );

        if (mobileOrders.length === 0) {
            return res.status(404).json({ success: false, message: 'Invalid or expired token' });
        }

        // Get all active products with categories
        const [products] = await promisePool.query(`
            SELECT p.*, c.name as category_name, c.color as category_color
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            ORDER BY c.display_order, p.name
        `);

        // Get categories
        const [categories] = await promisePool.query(
            'SELECT * FROM categories ORDER BY display_order'
        );

        res.status(200).json({
            success: true,
            data: {
                categories,
                products
            }
        });
    } catch (error) {
        next(error);
    }
};
