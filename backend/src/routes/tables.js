import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * GET /api/tables
 * List all tables (optional)
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [tables] = await pool.query('SELECT * FROM tables ORDER BY number ASC');
        res.json({
            status: 'success',
            data: { tables }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch tables'
        });
    }
});

/**
 * GET /api/tables/by-floor/:floor_id
 * Get tables for a specific floor
 */
router.get('/by-floor/:floor_id', authenticateToken, async (req, res) => {
    try {
        const { floor_id } = req.params;
        const [tables] = await pool.query(
            'SELECT * FROM tables WHERE floor_id = ? ORDER BY number ASC',
            [floor_id]
        );

        res.json({
            status: 'success',
            data: { tables }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch tables for floor'
        });
    }
});

/**
 * POST /api/tables
 * Create a table
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            floor_id,
            number,
            seats,
            shape = 'square',
            position_x = 0,
            position_y = 0,
            width = 100,
            height = 100,
            color = '#8b6940'
        } = req.body;

        if (!floor_id || !number || !seats) {
            return res.status(400).json({
                status: 'error',
                message: 'Floor, number, and seats are required'
            });
        }

        // Check duplicate number on floor
        const [existing] = await pool.query(
            'SELECT id FROM tables WHERE floor_id = ? AND number = ?',
            [floor_id, number]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'Table number already exists on this floor'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO tables 
      (floor_id, number, seats, shape, position_x, position_y, width, height, color, active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [floor_id, number, seats, shape, position_x, position_y, width, height, color]
        );

        const [newTable] = await pool.query('SELECT * FROM tables WHERE id = ?', [result.insertId]);

        res.status(201).json({
            status: 'success',
            message: 'Table created successfully',
            data: { table: newTable[0] }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to create table',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/tables/:id
 * Update a table (position, props, etc.)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            number,
            seats,
            shape,
            position_x,
            position_y,
            width,
            height,
            color,
            active
        } = req.body;

        // Build dynamic update query
        let fields = [];
        let values = [];

        if (number !== undefined) { fields.push('number = ?'); values.push(number); }
        if (seats !== undefined) { fields.push('seats = ?'); values.push(seats); }
        if (shape !== undefined) { fields.push('shape = ?'); values.push(shape); }
        if (position_x !== undefined) { fields.push('position_x = ?'); values.push(position_x); }
        if (position_y !== undefined) { fields.push('position_y = ?'); values.push(position_y); }
        if (width !== undefined) { fields.push('width = ?'); values.push(width); }
        if (height !== undefined) { fields.push('height = ?'); values.push(height); }
        if (color !== undefined) { fields.push('color = ?'); values.push(color); }
        if (active !== undefined) { fields.push('active = ?'); values.push(active); }

        if (fields.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No fields to update' });
        }

        values.push(id);

        const [result] = await pool.query(
            `UPDATE tables SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Table not found'
            });
        }

        const [updatedTable] = await pool.query('SELECT * FROM tables WHERE id = ?', [id]);

        res.json({
            status: 'success',
            message: 'Table updated successfully',
            data: { table: updatedTable[0] }
        });
    } catch (error) {
        console.error('Update table error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update table'
        });
    }
});

/**
 * DELETE /api/tables/:id
 * Delete a table
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM tables WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Table not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Table deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete table'
        });
    }
});

export default router;
