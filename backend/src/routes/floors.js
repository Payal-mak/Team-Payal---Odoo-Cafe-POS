import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * GET /api/floors
 * List all floors
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [floors] = await pool.query('SELECT * FROM floors ORDER BY name ASC');
        res.json({
            status: 'success',
            data: { floors }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch floors'
        });
    }
});

/**
 * POST /api/floors
 * Create a floor (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, pos_config_id } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Floor name is required'
            });
        }

        // Ensure POS Config exists, if not provided use/create default
        let configId = pos_config_id;
        if (!configId) {
            const [configs] = await pool.query('SELECT id FROM pos_configs LIMIT 1');
            if (configs.length > 0) {
                configId = configs[0].id;
            } else {
                const [newConfig] = await pool.query("INSERT INTO pos_configs (name) VALUES ('Main Shop')");
                configId = newConfig.insertId;
            }
        }

        const [result] = await pool.query(
            'INSERT INTO floors (name, pos_config_id) VALUES (?, ?)',
            [name, configId]
        );

        const [newFloor] = await pool.query('SELECT * FROM floors WHERE id = ?', [result.insertId]);

        res.status(201).json({
            status: 'success',
            message: 'Floor created successfully',
            data: { floor: newFloor[0] }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to create floor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/floors/:id
 * Update a floor (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Floor name is required'
            });
        }

        const [result] = await pool.query(
            'UPDATE floors SET name = ? WHERE id = ?',
            [name, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Floor not found'
            });
        }

        const [updatedFloor] = await pool.query('SELECT * FROM floors WHERE id = ?', [id]);

        res.json({
            status: 'success',
            message: 'Floor updated successfully',
            data: { floor: updatedFloor[0] }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to update floor'
        });
    }
});

/**
 * DELETE /api/floors/:id
 * Delete a floor (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if floor has tables? Cascade delete is usually set in DB, but let's be safe.
        // The SQL schema says: FOREIGN KEY (floor_id) REFERENCES floors (id) ON DELETE CASCADE
        // So tables will be deleted automatically.

        const [result] = await pool.query('DELETE FROM floors WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Floor not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Floor deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete floor'
        });
    }
});

export default router;
