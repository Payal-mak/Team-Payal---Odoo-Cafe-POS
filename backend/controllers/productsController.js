import { query } from '../config/database.js';

// @desc    Get all products with variants
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
    try {
        const { search, category } = req.query;

        let sql = `SELECT p.*, c.name as category_name, c.color as category_color 
               FROM products p 
               LEFT JOIN categories c ON p.category_id = c.id 
               WHERE 1=1`;
        const params = [];

        if (search) {
            sql += ' AND p.name LIKE ?';
            params.push(`%${search}%`);
        }

        if (category) {
            sql += ' AND p.category_id = ?';
            params.push(category);
        }

        sql += ' ORDER BY p.created_at DESC';

        const products = await query(sql, params);

        // Get variants for each product
        for (let product of products) {
            const variants = await query(
                'SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at',
                [product.id]
            );
            product.variants = variants;
        }

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const products = await query(
            `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const variants = await query(
            'SELECT * FROM product_variants WHERE product_id = ?',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...products[0],
                variants
            }
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

// @desc    Create product with variants
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
    try {
        const { name, category_id, price, unit, tax, description, image, variants } = req.body;

        if (!name || !category_id || !price) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, and price are required'
            });
        }

        // Insert product
        const result = await query(
            `INSERT INTO products (name, category_id, price, unit, tax, description, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id, price, unit || 'Unit', tax || 0, description || '', image || null]
        );

        const productId = result.insertId;

        // Insert variants if provided
        if (variants && variants.length > 0) {
            for (const variant of variants) {
                await query(
                    `INSERT INTO product_variants (product_id, attribute_name, value, price, unit) 
           VALUES (?, ?, ?, ?, ?)`,
                    [productId, variant.attribute_name || 'Size', variant.value, variant.price, variant.unit || 'Unit']
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                id: productId,
                name
            }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category_id, price, unit, tax, description, image, variants } = req.body;

        // Update product
        await query(
            `UPDATE products 
       SET name = ?, category_id = ?, price = ?, unit = ?, tax = ?, description = ?, image = ? 
       WHERE id = ?`,
            [name, category_id, price, unit, tax, description, image, id]
        );

        // Delete existing variants
        await query('DELETE FROM product_variants WHERE product_id = ?', [id]);

        // Insert new variants
        if (variants && variants.length > 0) {
            for (const variant of variants) {
                await query(
                    `INSERT INTO product_variants (product_id, attribute_name, value, price, unit) 
           VALUES (?, ?, ?, ?, ?)`,
                    [id, variant.attribute_name || 'Size', variant.value, variant.price, variant.unit || 'Unit']
                );
            }
        }

        res.json({
            success: true,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete variants first
        await query('DELETE FROM product_variants WHERE product_id = ?', [id]);

        // Delete product
        await query('DELETE FROM products WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// @desc    Delete multiple products
// @route   DELETE /api/products
// @access  Private
export const deleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide product IDs to delete'
            });
        }

        const placeholders = ids.map(() => '?').join(',');

        // Delete variants
        await query(`DELETE FROM product_variants WHERE product_id IN (${placeholders})`, ids);

        // Delete products
        await query(`DELETE FROM products WHERE id IN (${placeholders})`, ids);

        res.json({
            success: true,
            message: 'Products deleted successfully'
        });
    } catch (error) {
        console.error('Delete products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting products',
            error: error.message
        });
    }
};
