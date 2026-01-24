import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin, requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * GET /api/categories
 * List all categories
 */
router.get('/', async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT * FROM categories ORDER BY sequence ASC, name ASC'
        );

        res.json({
            status: 'success',
            data: { categories }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/categories
 * Create a category (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, color, sequence } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Category name is required'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO categories (name, color, sequence) VALUES (?, ?, ?)',
            [name, color, sequence || 0]
        );

        const [newCategory] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            status: 'success',
            message: 'Category created successfully',
            data: { category: newCategory[0] }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: 'error',
                message: 'Category with this name already exists'
            });
        }
        res.status(500).json({
            status: 'error',
            message: 'Failed to create category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * PUT /api/categories/:id
 * Update a category (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, sequence } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Category name is required'
            });
        }

        const [result] = await pool.query(
            'UPDATE categories SET name = ?, color = ?, sequence = ? WHERE id = ?',
            [name, color, sequence, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found'
            });
        }

        const [updatedCategory] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        res.json({
            status: 'success',
            message: 'Category updated successfully',
            data: { category: updatedCategory[0] }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: 'error',
                message: 'Category with this name already exists'
            });
        }
        res.status(500).json({
            status: 'error',
            message: 'Failed to update category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * DELETE /api/categories/:id
 * Delete a category (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category is used by any products
        const [products] = await pool.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [id]
        );

        if (products[0].count > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'Cannot delete category containing products. Please move or delete products first.'
            });
        }

        const [result] = await pool.query(
            'DELETE FROM categories WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Category not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete category',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
