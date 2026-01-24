import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/sessions/active
 * Get active session for the current user or default config
 */
router.get('/active', authenticateToken, async (req, res) => {
    try {
        // For MVP, checking status for default config #1 or based on user
        // Ideally, pass pos_config_id in query
        const posConfigId = req.query.pos_config_id || 1;

        const [sessions] = await pool.query(
            `SELECT s.*, u.username 
       FROM pos_sessions s 
       LEFT JOIN users u ON s.responsible_user_id = u.id
       WHERE s.pos_config_id = ? AND s.status = 'open' 
       ORDER BY s.open_date DESC LIMIT 1`,
            [posConfigId]
        );

        if (sessions.length === 0) {
            return res.json({
                status: 'success',
                data: { session: null }
            });
        }

        res.json({
            status: 'success',
            data: { session: sessions[0] }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch active session',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/sessions/open
 * Open a new session
 */
router.post('/open', authenticateToken, async (req, res) => {
    try {
        // Determine POS Config (default 1)
        let posConfigId = req.body.pos_config_id || 1;

        // Check if config exists, create if not (auto-init)
        const [configs] = await pool.query('SELECT id FROM pos_configs WHERE id = ?', [posConfigId]);
        if (configs.length === 0) {
            const [newConfig] = await pool.query("INSERT INTO pos_configs (name) VALUES ('Main Shop')");
            posConfigId = newConfig.insertId;
        }

        // Check if there's already an open session
        const [existing] = await pool.query(
            "SELECT id FROM pos_sessions WHERE pos_config_id = ? AND status = 'open'",
            [posConfigId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'A session is already open for this POS',
                data: { sessionId: existing[0].id }
            });
        }

        const [result] = await pool.query(
            `INSERT INTO pos_sessions 
      (pos_config_id, responsible_user_id, open_date, status, sale_amount) 
      VALUES (?, ?, NOW(), 'open', 0)`,
            [posConfigId, req.user.id]
        );

        const [newSession] = await pool.query('SELECT * FROM pos_sessions WHERE id = ?', [result.insertId]);

        res.status(201).json({
            status: 'success',
            message: 'Session opened successfully',
            data: { session: newSession[0] }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to open session',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/sessions/:id
 * Get details of a specific session
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [sessions] = await pool.query(
            'SELECT * FROM pos_sessions WHERE id = ?',
            [id]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Session not found'
            });
        }

        res.json({
            status: 'success',
            data: { session: sessions[0] }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch session'
        });
    }
});

export default router;
