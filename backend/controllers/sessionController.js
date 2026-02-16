const { promisePool } = require('../config/database');

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res, next) => {
    try {
        const [sessions] = await promisePool.query(`
            SELECT 
                s.*,
                t.name as terminal_name,
                u.full_name as user_name
            FROM pos_sessions s
            LEFT JOIN pos_terminals t ON s.terminal_id = t.id
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.opened_at DESC
        `);

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Open new session
// @route   POST /api/sessions/open
// @access  Private
exports.openSession = async (req, res, next) => {
    try {
        const { terminal_id, opening_balance } = req.body;

        if (!terminal_id) {
            return res.status(400).json({
                success: false,
                message: 'Please provide terminal_id'
            });
        }

        // Check if terminal has an open session
        const [existingSessions] = await promisePool.query(
            'SELECT id FROM pos_sessions WHERE terminal_id = ? AND status = ?',
            [terminal_id, 'open']
        );

        if (existingSessions.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Terminal already has an open session'
            });
        }

        // Create new session
        const [result] = await promisePool.query(
            'INSERT INTO pos_sessions (terminal_id, user_id, opened_at, opening_balance, status) VALUES (?, ?, NOW(), ?, ?)',
            [terminal_id, req.user.id, opening_balance || 0, 'open']
        );

        // Update terminal status
        await promisePool.query(
            'UPDATE pos_terminals SET status = ?, last_session_date = NOW() WHERE id = ?',
            ['open', terminal_id]
        );

        const [sessions] = await promisePool.query(
            'SELECT * FROM pos_sessions WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Session opened successfully',
            data: sessions[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get session details
// @route   GET /api/sessions/:id
// @access  Private
exports.getSession = async (req, res, next) => {
    try {
        const [sessions] = await promisePool.query(`
            SELECT 
                s.*,
                t.name as terminal_name,
                u.full_name as user_name
            FROM pos_sessions s
            LEFT JOIN pos_terminals t ON s.terminal_id = t.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `, [req.params.id]);

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.status(200).json({
            success: true,
            data: sessions[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Close session
// @route   PUT /api/sessions/:id/close
// @access  Private
exports.closeSession = async (req, res, next) => {
    try {
        const { closing_balance } = req.body;

        // Get session
        const [sessions] = await promisePool.query(
            'SELECT * FROM pos_sessions WHERE id = ?',
            [req.params.id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const session = sessions[0];

        if (session.status === 'closed') {
            return res.status(400).json({
                success: false,
                message: 'Session is already closed'
            });
        }

        // Close session
        await promisePool.query(
            'UPDATE pos_sessions SET status = ?, closed_at = NOW(), closing_balance = ? WHERE id = ?',
            ['closed', closing_balance || 0, req.params.id]
        );

        // Update terminal
        await promisePool.query(
            'UPDATE pos_terminals SET status = ?, last_closing_amount = ? WHERE id = ?',
            ['closed', closing_balance || 0, session.terminal_id]
        );

        const [updatedSessions] = await promisePool.query(
            'SELECT * FROM pos_sessions WHERE id = ?',
            [req.params.id]
        );

        res.status(200).json({
            success: true,
            message: 'Session closed successfully',
            data: updatedSessions[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get active sessions
// @route   GET /api/sessions/active
// @access  Private
exports.getActiveSessions = async (req, res, next) => {
    try {
        const [sessions] = await promisePool.query(`
            SELECT 
                s.*,
                t.name as terminal_name,
                u.full_name as user_name
            FROM pos_sessions s
            LEFT JOIN pos_terminals t ON s.terminal_id = t.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status = 'open'
            ORDER BY s.opened_at DESC
        `);

        res.status(200).json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        next(error);
    }
};
