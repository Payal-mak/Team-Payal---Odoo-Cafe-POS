import { query } from '../config/database.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
    try {
        const categories = await query(
            'SELECT * FROM categories ORDER BY sequence, created_at'
        );

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Get max sequence
        const maxSeq = await query('SELECT MAX(sequence) as max_seq FROM categories');
        const sequence = (maxSeq[0].max_seq || 0) + 1;

        const result = await query(
            'INSERT INTO categories (name, color, sequence) VALUES (?, ?, ?)',
            [name, color || '#e67e22', sequence]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: {
                id: result.insertId,
                name,
                color: color || '#e67e22',
                sequence
            }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, sequence } = req.body;

        await query(
            'UPDATE categories SET name = ?, color = ?, sequence = ? WHERE id = ?',
            [name, color, sequence, id]
        );

        res.json({
            success: true,
            message: 'Category updated successfully'
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM categories WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private
export const reorderCategories = async (req, res) => {
    try {
        const { categories } = req.body;

        // Update sequence for each category
        for (let i = 0; i < categories.length; i++) {
            await query(
                'UPDATE categories SET sequence = ? WHERE id = ?',
                [i + 1, categories[i].id]
            );
        }

        res.json({
            success: true,
            message: 'Categories reordered successfully'
        });
    } catch (error) {
        console.error('Reorder categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Error reordering categories',
            error: error.message
        });
    }
};
