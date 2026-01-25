import { query } from '../config/database.js';

// Get payment methods by POS config ID
export const getPaymentMethods = async (req, res) => {
    try {
        const { posConfigId } = req.params;

        // Get POS configuration with payment settings
        const configs = await query(
            `SELECT 
                id, name, cash_enabled, digital_enabled, 
                upi_enabled, upi_id 
            FROM pos_configs 
            WHERE id = ?`,
            [posConfigId]
        );

        if (configs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'POS configuration not found'
            });
        }

        const config = configs[0];

        // Build payment methods array based on enabled flags
        const paymentMethods = [];

        if (config.cash_enabled) {
            paymentMethods.push({
                id: 'cash',
                name: 'Cash',
                type: 'cash',
                icon: '💵',
                enabled: true
            });
        }

        if (config.digital_enabled) {
            paymentMethods.push({
                id: 'digital',
                name: 'Digital / Card',
                type: 'digital',
                icon: '💳',
                enabled: true
            });
        }

        if (config.upi_enabled) {
            paymentMethods.push({
                id: 'upi',
                name: 'UPI QR',
                type: 'upi',
                icon: '📱',
                enabled: true,
                upi_id: config.upi_id
            });
        }

        res.json({
            success: true,
            data: paymentMethods
        });
    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment methods'
        });
    }
};

// Process payment for an order
export const processPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { payment_method, amount_received } = req.body;

        // Validate payment method
        if (!payment_method || !['cash', 'digital', 'upi'].includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message: 'Valid payment method is required (cash, digital, or upi)'
            });
        }

        // Get the order
        const orders = await query(
            'SELECT id, total_amount, payment_status FROM orders WHERE id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orders[0];

        // Check if already paid
        if (order.payment_status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Order is already paid'
            });
        }

        // Update order with payment details
        await query(
            `UPDATE orders 
            SET payment_method = ?, 
                payment_status = 'paid',
                status = 'paid'
            WHERE id = ?`,
            [payment_method, orderId]
        );

        // Get updated order with details
        const updatedOrders = await query(`
            SELECT 
                o.*,
                t.number as table_number,
                f.name as floor_name
            FROM orders o
            LEFT JOIN \`tables\` t ON o.table_id = t.id
            LEFT JOIN floors f ON t.floor_id = f.id
            WHERE o.id = ?
        `, [orderId]);

        res.json({
            success: true,
            message: 'Payment processed successfully',
            data: updatedOrders[0]
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payment'
        });
    }
};
