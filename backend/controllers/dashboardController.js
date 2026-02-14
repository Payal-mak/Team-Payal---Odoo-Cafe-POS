import { query } from '../config/database.js';

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
export const getDashboardData = async (req, res) => {
    try {
        // Get POS terminals with their last session info
        const terminals = await query(
            `SELECT 
                pc.id,
                pc.name,
                pc.last_closing_sale_amount,
                ps.open_date as last_session_date
            FROM pos_configs pc 
            LEFT JOIN pos_sessions ps ON pc.last_open_session_id = ps.id
            ORDER BY pc.created_at DESC`
        );

        res.json({
            success: true,
            data: {
                terminals: terminals || []
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

// @desc    Create new POS terminal
// @route   POST /api/dashboard/terminal
// @access  Private
export const createTerminal = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Terminal name is required'
            });
        }

        const result = await query(
            'INSERT INTO pos_configs (name) VALUES (?)',
            [name]
        );

        res.status(201).json({
            success: true,
            message: 'Terminal created successfully',
            terminal: {
                id: result.insertId,
                name
            }
        });
    } catch (error) {
        console.error('Create terminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating terminal',
            error: error.message
        });
    }
};

// @desc    Update POS configuration
// @route   PUT /api/dashboard/terminal/:id/config
// @access  Private
export const updatePosConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { upi_id, cash_enabled, digital_enabled, upi_enabled } = req.body;

        const result = await query(
            `UPDATE pos_configs 
       SET upi_id = ?, 
           cash_enabled = ?, 
           digital_enabled = ?, 
           upi_enabled = ?
       WHERE id = ?`,
            [upi_id || null, cash_enabled ? 1 : 0, digital_enabled ? 1 : 0, upi_enabled ? 1 : 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        res.json({
            success: true,
            message: 'Configuration updated successfully'
        });
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating configuration',
            error: error.message
        });
    }
};

// @desc    Get single terminal config
// @route   GET /api/dashboard/terminal/:id
// @access  Private
export const getTerminalConfig = async (req, res) => {
    try {
        const { id } = req.params;

        const terminals = await query(
            'SELECT * FROM pos_configs WHERE id = ?',
            [id]
        );

        if (terminals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        res.json({
            success: true,
            data: terminals[0]
        });
    } catch (error) {
        console.error('Get terminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching terminal',
            error: error.message
        });
    }
};

// @desc    Open new POS session
// @route   POST /api/dashboard/terminal/:id/session
// @access  Private
export const openSession = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if terminal exists
        const terminals = await query(
            'SELECT id FROM pos_configs WHERE id = ?',
            [id]
        );

        if (terminals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        // Check if there's already an open session for this terminal
        const openSessions = await query(
            'SELECT id FROM pos_sessions WHERE pos_config_id = ? AND status = "open"',
            [id]
        );

        if (openSessions.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Terminal already has an open session'
            });
        }

        // Create new session with current timestamp
        const result = await query(
            'INSERT INTO pos_sessions (pos_config_id, responsible_user_id, open_date, status, sale_amount) VALUES (?, ?, NOW(), "open", 0.00)',
            [id, req.user.id]
        );

        // Update terminal's last_open_session_id
        await query(
            'UPDATE pos_configs SET last_open_session_id = ? WHERE id = ?',
            [result.insertId, id]
        );

        res.json({
            success: true,
            message: 'Session opened successfully',
            session: {
                id: result.insertId,
                pos_config_id: id,
                status: 'open'
            }
        });
    } catch (error) {
        console.error('Open session error:', error);
        res.status(500).json({
            success: false,
            message: 'Error opening session',
            error: error.message
        });
    }
};
