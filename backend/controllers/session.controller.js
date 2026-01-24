import { query } from '../config/database.js';

// Open a new POS session
export const openSession = async (req, res) => {
    try {
        const { pos_config_id, opening_balance = 0 } = req.body;
        const userId = req.user?.id || req.body.user_id;

        if (!pos_config_id) {
            return res.status(400).json({
                success: false,
                message: 'POS configuration ID is required'
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Check if user already has an active session
        const existingSession = await query(`
            SELECT id, pos_config_id FROM pos_sessions 
            WHERE responsible_user_id = ? AND status = 'open'
        `, [userId]);

        if (existingSession.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active session. Please close it before opening a new one.',
                activeSession: existingSession[0]
            });
        }

        // Verify POS config exists
        const posConfig = await query('SELECT id, name FROM pos_configs WHERE id = ?', [pos_config_id]);
        if (posConfig.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'POS configuration not found'
            });
        }

        // Create new session
        const result = await query(`
            INSERT INTO pos_sessions (pos_config_id, responsible_user_id, open_date, sale_amount, status)
            VALUES (?, ?, NOW(), 0, 'open')
        `, [pos_config_id, userId]);

        // Get the created session with details
        const newSession = await query(`
            SELECT 
                ps.id,
                ps.pos_config_id,
                ps.responsible_user_id,
                ps.open_date,
                ps.close_date,
                ps.sale_amount,
                ps.status,
                pc.name as pos_name,
                u.username as responsible_user
            FROM pos_sessions ps
            LEFT JOIN pos_configs pc ON ps.pos_config_id = pc.id
            LEFT JOIN users u ON ps.responsible_user_id = u.id
            WHERE ps.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Session opened successfully',
            data: {
                ...newSession[0],
                opening_balance: parseFloat(opening_balance)
            }
        });
    } catch (error) {
        console.error('Open session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to open session'
        });
    }
};

// Close an active session
export const closeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { closing_balance = 0 } = req.body;

        // Get session details
        const session = await query(`
            SELECT 
                ps.*,
                pc.name as pos_name,
                u.username as responsible_user
            FROM pos_sessions ps
            LEFT JOIN pos_configs pc ON ps.pos_config_id = pc.id
            LEFT JOIN users u ON ps.responsible_user_id = u.id
            WHERE ps.id = ?
        `, [id]);

        if (session.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (session[0].status === 'closed') {
            return res.status(400).json({
                success: false,
                message: 'This session is already closed'
            });
        }

        // Calculate total sales for this session
        const salesResult = await query(`
            SELECT COALESCE(SUM(total_amount), 0) as total_sales
            FROM orders
            WHERE session_id = ? AND payment_status = 'paid'
        `, [id]);

        const totalSales = salesResult[0].total_sales;

        // Close the session
        await query(`
            UPDATE pos_sessions 
            SET close_date = NOW(), status = 'closed', sale_amount = ?
            WHERE id = ?
        `, [totalSales, id]);

        // Get updated session
        const closedSession = await query(`
            SELECT 
                ps.*,
                pc.name as pos_name,
                u.username as responsible_user
            FROM pos_sessions ps
            LEFT JOIN pos_configs pc ON ps.pos_config_id = pc.id
            LEFT JOIN users u ON ps.responsible_user_id = u.id
            WHERE ps.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Session closed successfully',
            data: {
                ...closedSession[0],
                closing_balance: parseFloat(closing_balance),
                total_sales: parseFloat(totalSales)
            }
        });
    } catch (error) {
        console.error('Close session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close session'
        });
    }
};

// Get current active session for user
export const getCurrentSession = async (req, res) => {
    try {
        const userId = req.query.user_id || req.user?.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const session = await query(`
            SELECT 
                ps.id,
                ps.pos_config_id,
                ps.responsible_user_id,
                ps.open_date,
                ps.close_date,
                ps.sale_amount,
                ps.status,
                pc.name as pos_name,
                u.username as responsible_user
            FROM pos_sessions ps
            LEFT JOIN pos_configs pc ON ps.pos_config_id = pc.id
            LEFT JOIN users u ON ps.responsible_user_id = u.id
            WHERE ps.responsible_user_id = ? AND ps.status = 'open'
            ORDER BY ps.open_date DESC
            LIMIT 1
        `, [userId]);

        if (session.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'No active session found'
            });
        }

        // Get order count and sales for this session
        const orderStats = await query(`
            SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_sales
            FROM orders
            WHERE session_id = ?
        `, [session[0].id]);

        res.json({
            success: true,
            data: {
                ...session[0],
                order_count: orderStats[0].order_count,
                total_sales: parseFloat(orderStats[0].total_sales)
            }
        });
    } catch (error) {
        console.error('Get current session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get current session'
        });
    }
};

// Get session history
export const getSessionHistory = async (req, res) => {
    try {
        const userId = req.query.user_id;
        const limit = parseInt(req.query.limit) || 20;

        let whereClause = '';
        let params = [];

        if (userId) {
            whereClause = 'WHERE ps.responsible_user_id = ?';
            params = [userId];
        }

        const sessions = await query(`
            SELECT 
                ps.id,
                ps.pos_config_id,
                ps.responsible_user_id,
                ps.open_date,
                ps.close_date,
                ps.sale_amount,
                ps.status,
                pc.name as pos_name,
                u.username as responsible_user
            FROM pos_sessions ps
            LEFT JOIN pos_configs pc ON ps.pos_config_id = pc.id
            LEFT JOIN users u ON ps.responsible_user_id = u.id
            ${whereClause}
            ORDER BY ps.open_date DESC
            LIMIT ?
        `, [...params, limit]);

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Get session history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get session history'
        });
    }
};

// Get session by ID
export const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await query(`
            SELECT 
                ps.id,
                ps.pos_config_id,
                ps.responsible_user_id,
                ps.open_date,
                ps.close_date,
                ps.sale_amount,
                ps.status,
                pc.name as pos_name,
                u.username as responsible_user
            FROM pos_sessions ps
            LEFT JOIN pos_configs pc ON ps.pos_config_id = pc.id
            LEFT JOIN users u ON ps.responsible_user_id = u.id
            WHERE ps.id = ?
        `, [id]);

        if (session.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Get order stats
        const orderStats = await query(`
            SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_sales
            FROM orders
            WHERE session_id = ?
        `, [id]);

        res.json({
            success: true,
            data: {
                ...session[0],
                order_count: orderStats[0].order_count,
                total_sales: parseFloat(orderStats[0].total_sales)
            }
        });
    } catch (error) {
        console.error('Get session by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get session'
        });
    }
};

// Get available POS configs
export const getPosConfigs = async (req, res) => {
    try {
        const configs = await query(`
            SELECT 
                id,
                name,
                cash_enabled,
                digital_enabled,
                upi_enabled,
                upi_id
            FROM pos_configs
            ORDER BY name
        `);

        res.json({
            success: true,
            data: configs
        });
    } catch (error) {
        console.error('Get POS configs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get POS configurations'
        });
    }
};
