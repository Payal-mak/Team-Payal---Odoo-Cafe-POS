import { query } from '../config/database.js';

// Get all products with category information
export const getAllProducts = async (req, res) => {
    try {
        const products = await query(`
            SELECT 
                p.id, 
                p.name, 
                p.category_id,
                c.name as category_name,
                p.price, 
                p.unit, 
                p.tax_rate, 
                p.description,
                p.is_kitchen_sent,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
};

// Get single product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const products = await query(`
            SELECT 
                p.id, 
                p.name, 
                p.category_id,
                c.name as category_name,
                p.price, 
                p.unit, 
                p.tax_rate, 
                p.description,
                p.is_kitchen_sent,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: products[0]
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
};

// Create new product
export const createProduct = async (req, res) => {
    try {
        const { name, category_id, price, unit, tax_rate, description, is_kitchen_sent } = req.body;

        // Validation
        if (!name || !price || !unit || tax_rate === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, unit, and tax_rate are required'
            });
        }

        // Validate unit enum
        const validUnits = ['kg', 'unit', 'litre'];
        if (!validUnits.includes(unit)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid unit. Must be one of: kg, unit, litre'
            });
        }

        const result = await query(
            `INSERT INTO products (name, category_id, price, unit, tax_rate, description, is_kitchen_sent) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id || null, price, unit, tax_rate, description || null, is_kitchen_sent || 0]
        );

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                id: result.insertId,
                name,
                category_id,
                price,
                unit,
                tax_rate,
                description,
                is_kitchen_sent: is_kitchen_sent || 0
            }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category_id, price, unit, tax_rate, description, is_kitchen_sent } = req.body;

        // Check if product exists
        const existingProduct = await query('SELECT id FROM products WHERE id = ?', [id]);
        if (existingProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Validate unit if provided
        if (unit) {
            const validUnits = ['kg', 'unit', 'litre'];
            if (!validUnits.includes(unit)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid unit. Must be one of: kg, unit, litre'
                });
            }
        }

        await query(
            `UPDATE products 
             SET name = ?, category_id = ?, price = ?, unit = ?, tax_rate = ?, description = ?, is_kitchen_sent = ?
             WHERE id = ?`,
            [name, category_id || null, price, unit, tax_rate, description || null, is_kitchen_sent || 0, id]
        );

        res.json({
            success: true,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const existingProduct = await query('SELECT id FROM products WHERE id = ?', [id]);
        if (existingProduct.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await query('DELETE FROM products WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
};

// ============ CATEGORIES ============

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await query(`
            SELECT id, name, color, sequence, created_at, updated_at
            FROM categories
            ORDER BY sequence ASC, name ASC
        `);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get all categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};

// Create category
export const createCategory = async (req, res) => {
    try {
        const { name, color, sequence } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const result = await query(
            'INSERT INTO categories (name, color, sequence) VALUES (?, ?, ?)',
            [name, color || null, sequence || null]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: {
                id: result.insertId,
                name,
                color,
                sequence
            }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color, sequence } = req.body;

        const existingCategory = await query('SELECT id FROM categories WHERE id = ?', [id]);
        if (existingCategory.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        await query(
            'UPDATE categories SET name = ?, color = ?, sequence = ? WHERE id = ?',
            [name, color || null, sequence || null, id]
        );

        res.json({
            success: true,
            message: 'Category updated successfully'
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category'
        });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const existingCategory = await query('SELECT id FROM categories WHERE id = ?', [id]);
        if (existingCategory.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        await query('DELETE FROM categories WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
};
