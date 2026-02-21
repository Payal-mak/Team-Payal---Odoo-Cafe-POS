const { promisePool } = require('../config/database');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
    try {
        const [categories] = await promisePool.query(
            'SELECT * FROM categories ORDER BY display_order ASC, name ASC'
        );

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
    try {
        const { name, color, display_order } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide category name'
            });
        }

        const [result] = await promisePool.query(
            'INSERT INTO categories (name, color, display_order) VALUES (?, ?, ?)',
            [name, color || '#2D5F5D', display_order || 0]
        );

        const [categories] = await promisePool.query(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: categories[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
    try {
        const { name, color, display_order } = req.body;

        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (color) {
            updateFields.push('color = ?');
            updateValues.push(color);
        }
        if (display_order !== undefined) {
            updateFields.push('display_order = ?');
            updateValues.push(display_order);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(req.params.id);

        await promisePool.query(
            `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        const [categories] = await promisePool.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: categories[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if any products use this category
        const [products] = await promisePool.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
            [id]
        );

        if (products[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete — ${products[0].count} product(s) are using this category. Reassign or delete those products first.`
            });
        }

        const [result] = await promisePool.query(
            'DELETE FROM categories WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private/Admin
exports.reorderCategories = async (req, res, next) => {
    try {
        const { categories } = req.body; // Array of {id, display_order}

        if (!categories || !Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide categories array'
            });
        }

        // Update each category's display_order
        for (const category of categories) {
            await promisePool.query(
                'UPDATE categories SET display_order = ? WHERE id = ?',
                [category.display_order, category.id]
            );
        }

        const [updatedCategories] = await promisePool.query(
            'SELECT * FROM categories ORDER BY display_order ASC'
        );

        res.status(200).json({
            success: true,
            message: 'Categories reordered successfully',
            data: updatedCategories
        });
    } catch (error) {
        next(error);
    }
};
