const { promisePool } = require('../config/database');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    try {
        const { category_id, is_active } = req.query;

        let query = `
            SELECT p.*, c.name as category_name, c.color as category_color
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (category_id) {
            query += ' AND p.category_id = ?';
            queryParams.push(category_id);
        }

        if (is_active !== undefined) {
            query += ' AND p.is_active = ?';
            queryParams.push(is_active === 'true' ? 1 : 0);
        }

        query += ' ORDER BY p.created_at DESC';

        const [products] = await promisePool.query(query, queryParams);

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
    try {
        const { name, category_id, price, unit, tax_percentage, description, image_url } = req.body;

        if (!name || !category_id || !price) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, category_id, and price'
            });
        }

        const [result] = await promisePool.query(
            'INSERT INTO products (name, category_id, price, unit, tax_percentage, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, category_id, price, unit || 'Unit', tax_percentage || 0, description, image_url]
        );

        const [products] = await promisePool.query(
            'SELECT * FROM products WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: products[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get product details
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
    try {
        const [products] = await promisePool.query(`
            SELECT p.*, c.name as category_name, c.color as category_color
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get variants
        const [variants] = await promisePool.query(
            'SELECT * FROM product_variants WHERE product_id = ?',
            [req.params.id]
        );

        const product = products[0];
        product.variants = variants;

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
    try {
        const { name, category_id, price, unit, tax_percentage, description, image_url, is_active } = req.body;

        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (category_id) {
            updateFields.push('category_id = ?');
            updateValues.push(category_id);
        }
        if (price !== undefined) {
            updateFields.push('price = ?');
            updateValues.push(price);
        }
        if (unit) {
            updateFields.push('unit = ?');
            updateValues.push(unit);
        }
        if (tax_percentage !== undefined) {
            updateFields.push('tax_percentage = ?');
            updateValues.push(tax_percentage);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (image_url !== undefined) {
            updateFields.push('image_url = ?');
            updateValues.push(image_url);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(req.params.id);

        await promisePool.query(
            `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        const [products] = await promisePool.query(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: products[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
    try {
        const [result] = await promisePool.query(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
    try {
        const [products] = await promisePool.query(
            'SELECT * FROM products WHERE category_id = ? AND is_active = 1 ORDER BY name',
            [req.params.categoryId]
        );

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get variants for product
// @route   GET /api/products/:productId/variants
// @access  Public
exports.getProductVariants = async (req, res, next) => {
    try {
        const [variants] = await promisePool.query(
            'SELECT * FROM product_variants WHERE product_id = ? ORDER BY attribute_name, extra_price',
            [req.params.productId]
        );

        res.status(200).json({
            success: true,
            count: variants.length,
            data: variants
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create variant
// @route   POST /api/products/:productId/variants
// @access  Private/Admin
exports.createProductVariant = async (req, res, next) => {
    try {
        const { attribute_name, attribute_value, extra_price } = req.body;

        if (!attribute_name || !attribute_value) {
            return res.status(400).json({
                success: false,
                message: 'Please provide attribute_name and attribute_value'
            });
        }

        const [result] = await promisePool.query(
            'INSERT INTO product_variants (product_id, attribute_name, attribute_value, extra_price) VALUES (?, ?, ?, ?)',
            [req.params.productId, attribute_name, attribute_value, extra_price || 0]
        );

        const [variants] = await promisePool.query(
            'SELECT * FROM product_variants WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Variant created successfully',
            data: variants[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete variant
// @route   DELETE /api/products/:productId/variants/:id
// @access  Private/Admin
exports.deleteProductVariant = async (req, res, next) => {
    try {
        const [result] = await promisePool.query(
            'DELETE FROM product_variants WHERE id = ? AND product_id = ?',
            [req.params.id, req.params.productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Variant deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
