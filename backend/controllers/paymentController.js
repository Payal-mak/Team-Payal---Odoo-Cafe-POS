const { promisePool } = require('../config/database');

// Get all payments
exports.getPayments = async (req, res, next) => {
    try {
        const [payments] = await promisePool.query(`
            SELECT p.*, o.order_number
            FROM payments p
            LEFT JOIN orders o ON p.order_id = o.id
            ORDER BY p.created_at DESC
        `);
        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        next(error);
    }
};

// Process payment
exports.processPayment = async (req, res, next) => {
    try {
        const { order_id, payment_method_id, payment_type, amount } = req.body;

        if (!order_id || !payment_method_id || !payment_type || !amount) {
            return res.status(400).json({ success: false, message: 'Please provide order_id, payment_method_id, payment_type, and amount' });
        }

        // Create payment
        const [result] = await promisePool.query(
            'INSERT INTO payments (order_id, payment_method_id, payment_type, amount, status) VALUES (?, ?, ?, ?, ?)',
            [order_id, payment_method_id, payment_type, amount, 'completed']
        );

        // Check if order is fully paid
        const [orders] = await promisePool.query('SELECT total_amount FROM orders WHERE id = ?', [order_id]);
        const [paymentSum] = await promisePool.query(
            'SELECT SUM(amount) as total_paid FROM payments WHERE order_id = ? AND status = ?',
            [order_id, 'completed']
        );

        const totalPaid = paymentSum[0].total_paid || 0;
        const orderTotal = orders[0].total_amount;

        let paymentStatus = 'unpaid';
        let orderStatus = 'completed';

        if (totalPaid >= orderTotal) {
            paymentStatus = 'paid';
            orderStatus = 'paid';

            // Update table status to available
            await promisePool.query(`
                UPDATE tables SET status = 'available' 
                WHERE id = (SELECT table_id FROM orders WHERE id = ?)
            `, [order_id]);
        } else if (totalPaid > 0) {
            paymentStatus = 'partial';
        }

        await promisePool.query(
            'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
            [paymentStatus, orderStatus, order_id]
        );

        const [payments] = await promisePool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, message: 'Payment processed successfully', data: payments[0] });
    } catch (error) {
        next(error);
    }
};

// Get payment details
exports.getPayment = async (req, res, next) => {
    try {
        const [payments] = await promisePool.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
        if (payments.length === 0) return res.status(404).json({ success: false, message: 'Payment not found' });

        res.status(200).json({ success: true, data: payments[0] });
    } catch (error) {
        next(error);
    }
};

// Get payments by order
exports.getPaymentsByOrder = async (req, res, next) => {
    try {
        const [payments] = await promisePool.query(
            'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
            [req.params.orderId]
        );
        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        next(error);
    }
};

// Generate UPI QR code
exports.generateUPIQR = async (req, res, next) => {
    try {
        const { amount, order_id } = req.body;

        if (!amount) {
            return res.status(400).json({ success: false, message: 'Please provide amount' });
        }

        // Use UPI ID from environment or default
        const upiId = process.env.UPI_ID || 'merchant@upi';
        const merchantName = process.env.MERCHANT_NAME || 'Odoo Cafe POS';

        // UPI payment URL format
        const qrString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR${order_id ? `&tn=Order${order_id}` : ''}`;

        res.status(200).json({
            success: true,
            data: {
                qr_string: qrString,
                upi_id: upiId,
                merchant_name: merchantName,
                amount
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get all payment methods
exports.getPaymentMethods = async (req, res, next) => {
    try {
        const [methods] = await promisePool.query('SELECT * FROM payment_methods WHERE is_enabled = 1');
        res.status(200).json({ success: true, count: methods.length, data: methods });
    } catch (error) {
        next(error);
    }
};

// Create payment method
exports.createPaymentMethod = async (req, res, next) => {
    try {
        const { name, type, upi_id } = req.body;
        if (!name || !type) {
            return res.status(400).json({ success: false, message: 'Please provide name and type' });
        }

        const [result] = await promisePool.query(
            'INSERT INTO payment_methods (name, type, upi_id) VALUES (?, ?, ?)',
            [name, type, upi_id]
        );
        const [methods] = await promisePool.query('SELECT * FROM payment_methods WHERE id = ?', [result.insertId]);

        res.status(201).json({ success: true, message: 'Payment method created', data: methods[0] });
    } catch (error) {
        next(error);
    }
};

// Update payment method
exports.updatePaymentMethod = async (req, res, next) => {
    try {
        const { name, is_enabled, upi_id } = req.body;
        const updateFields = [];
        const updateValues = [];

        if (name) { updateFields.push('name = ?'); updateValues.push(name); }
        if (is_enabled !== undefined) { updateFields.push('is_enabled = ?'); updateValues.push(is_enabled); }
        if (upi_id !== undefined) { updateFields.push('upi_id = ?'); updateValues.push(upi_id); }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updateValues.push(req.params.id);
        await promisePool.query(`UPDATE payment_methods SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        const [methods] = await promisePool.query('SELECT * FROM payment_methods WHERE id = ?', [req.params.id]);

        res.status(200).json({ success: true, message: 'Payment method updated', data: methods[0] });
    } catch (error) {
        next(error);
    }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res, next) => {
    try {
        const [result] = await promisePool.query('DELETE FROM payment_methods WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Payment method not found' });

        res.status(200).json({ success: true, message: 'Payment method deleted', data: {} });
    } catch (error) {
        next(error);
    }
};
