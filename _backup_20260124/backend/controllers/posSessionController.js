import pool from '../config/database.js';

// Open POS Session
export const openSession = async (req, res) => {
    try {
        const { terminalId, openingBalance } = req.body;
        const openedBy = req.user.userId;

        // Validation
        if (!terminalId) {
            return res.status(400).json({
                success: false,
                message: 'Terminal ID is required'
            });
        }

        // Check if terminal exists
        const [terminals] = await pool.query(
            'SELECT id FROM pos_configs WHERE id = ?',
            [terminalId]
        );

        if (terminals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        // CRITICAL: Check if there's already an open session for this terminal
        const [openSessions] = await pool.query(
            'SELECT id FROM pos_sessions WHERE pos_config_id = ? AND status = ?',
            [terminalId, 'open']
        );

        if (openSessions.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This terminal already has an open session. Please close it first.'
            });
        }

        // Create new session
        const [result] = await pool.query(
            `INSERT INTO pos_sessions 
       (pos_config_id, responsible_user_id, open_date, sale_amount, status) 
       VALUES (?, ?, NOW(), 0.00, 'open')`,
            [terminalId, openedBy]
        );

        // Get the created session
        const [session] = await pool.query(
            `SELECT ps.*, u.username as opened_by_name
       FROM pos_sessions ps
       LEFT JOIN users u ON ps.responsible_user_id = u.id
       WHERE ps.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Session opened successfully',
            session: session[0]
        });

    } catch (error) {
        console.error('Open session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while opening session'
        });
    }
};

// Close POS Session
export const closeSession = async (req, res) => {
    try {
        const { sessionId, closingBalance } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        // Get session details
        const [sessions] = await pool.query(
            'SELECT * FROM pos_sessions WHERE id = ? AND status = ?',
            [sessionId, 'open']
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Open session not found'
            });
        }

        const session = sessions[0];

        // Close the session
        await pool.query(
            `UPDATE pos_sessions 
       SET status = 'closed', close_date = NOW()
       WHERE id = ?`,
            [sessionId]
        );

        // Update terminal's last session info
        await pool.query(
            `UPDATE pos_configs 
       SET last_open_session_id = ?, last_closing_sale_amount = ?
       WHERE id = ?`,
            [sessionId, session.sale_amount, session.pos_config_id]
        );

        // Get updated session
        const [updatedSession] = await pool.query(
            `SELECT ps.*, u.username as opened_by_name
       FROM pos_sessions ps
       LEFT JOIN users u ON ps.responsible_user_id = u.id
       WHERE ps.id = ?`,
            [sessionId]
        );

        res.json({
            success: true,
            message: 'Session closed successfully',
            session: updatedSession[0]
        });

    } catch (error) {
        console.error('Close session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while closing session'
        });
    }
};

// Get Current Session for Terminal
export const getCurrentSession = async (req, res) => {
    try {
        const { terminalId } = req.params;

        const [sessions] = await pool.query(
            `SELECT ps.*, u.username as opened_by_name
       FROM pos_sessions ps
       LEFT JOIN users u ON ps.responsible_user_id = u.id
       WHERE ps.pos_config_id = ? AND ps.status = 'open'
       ORDER BY ps.open_date DESC
       LIMIT 1`,
            [terminalId]
        );

        if (sessions.length === 0) {
            return res.json({
                success: true,
                session: null
            });
        }

        res.json({
            success: true,
            session: sessions[0]
        });

    } catch (error) {
        console.error('Get current session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching session'
        });
    }
};

// Get All Sessions for Terminal
export const getTerminalSessions = async (req, res) => {
    try {
        const { terminalId } = req.params;

        const [sessions] = await pool.query(
            `SELECT ps.*, u.username as opened_by_name
       FROM pos_sessions ps
       LEFT JOIN users u ON ps.responsible_user_id = u.id
       WHERE ps.pos_config_id = ?
       ORDER BY ps.open_date DESC`,
            [terminalId]
        );

        res.json({
            success: true,
            sessions
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching sessions'
        });
    }
};
