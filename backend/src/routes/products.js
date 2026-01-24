import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin, requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * GET /api/products
 * List all products with category data
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = `
      SELECT p.*, c.name as category_name, c.color as category_color 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.name ASC
    `;
        const [products] = await pool.query(query);

        res.json({
            status: 'success',
            data: { products }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch products',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/products/:id
 * Get product details with variants
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get product
        const [products] = await pool.query(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        const product = products[0];

        // Get variants
        const [variants] = await pool.query(
            'SELECT * FROM product_variants WHERE product_id = ? ORDER BY extra_price ASC',
            [id]
        );

        res.json({
            status: 'success',
            data: {
                product: {
                    ...product,
                    variants
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch product details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/products
 * Create product with variants (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const {
            name,
            category_id,
            price,
            unit,
            tax_rate,
            description,
            is_kitchen_sent,
            variants = []
        } = req.body;

        // Validate main product fields
        if (!name || !price || !unit || tax_rate === undefined) {
            await connection.rollback();
            return res.status(400).json({
                status: 'error',
                message: 'Required fields: name, price, unit, tax_rate'
            });
        }

        // Create Product
        const [prodResult] = await connection.query(
            `INSERT INTO products 
      (name, category_id, price, unit, tax_rate, description, is_kitchen_sent) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, category_id || null, price, unit, tax_rate, description, is_kitchen_sent ? 1 : 0]
        );

        const productId = prodResult.insertId;

        // Create Variants
        if (variants && variants.length > 0) {
            for (const variant of variants) {
                if (!variant.attribute_name || !variant.value) {
                    continue; // Skip invalid variants
                }

                await connection.query(
                    `INSERT INTO product_variants 
          (product_id, attribute_name, value, extra_price, unit) 
          VALUES (?, ?, ?, ?, ?)`,
                    [
                        productId,
                        variant.attribute_name,
                        variant.value,
                        variant.extra_price || 0,
                        variant.unit || 'unit'
                    ]
                );
            }
        }

        await connection.commit();

        // Fetch created product details
        const [newProduct] = await connection.query(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );

        const [newVariants] = await connection.query(
            'SELECT * FROM product_variants WHERE product_id = ?',
            [productId]
        );

        res.status(201).json({
            status: 'success',
            message: 'Product created successfully',
            data: {
                product: {
                    ...newProduct[0],
                    variants: newVariants
                }
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error('Create product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * PUT /api/products/:id
 * Update product and its variants (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            name,
            category_id,
            price,
            unit,
            tax_rate,
            description,
            is_kitchen_sent,
            variants = []
        } = req.body;

        // Check if product exists
        const [existing] = await connection.query('SELECT id FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        // Update Product
        await connection.query(
            `UPDATE products SET 
       name = ?, category_id = ?, price = ?, unit = ?, 
       tax_rate = ?, description = ?, is_kitchen_sent = ?
       WHERE id = ?`,
            [name, category_id || null, price, unit, tax_rate, description, is_kitchen_sent ? 1 : 0, id]
        );

        // Update Variants
        // Strategy: Delete all existing variants and recreate them (simplest approach for MVP)
        // In a real app, you might want to update or specifically delete to preserve historical data IDs

        // First check if any variant is used in order_lines? 
        // For MVP, we'll assume we can replace variants freely or just handle the basic replacement.
        // Ideally, we shouldn't delete variants if they are referenced.
        // Let's go with a safer approach: Only add new ones or update specific ones if we had IDs.
        // BUT since the frontend will send the full list, implementing "diffing" is complex.
        // "Delete all and Insert" is standard for simple associations.

        await connection.query('DELETE FROM product_variants WHERE product_id = ?', [id]);

        if (variants && variants.length > 0) {
            for (const variant of variants) {
                if (!variant.attribute_name || !variant.value) {
                    continue;
                }

                await connection.query(
                    `INSERT INTO product_variants 
          (product_id, attribute_name, value, extra_price, unit) 
          VALUES (?, ?, ?, ?, ?)`,
                    [
                        id,
                        variant.attribute_name,
                        variant.value,
                        variant.extra_price || 0,
                        variant.unit || 'unit'
                    ]
                );
            }
        }

        await connection.commit();

        // Fetch updated product
        const [updatedProduct] = await connection.query(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        const [updatedVariants] = await connection.query(
            'SELECT * FROM product_variants WHERE product_id = ?',
            [id]
        );

        res.json({
            status: 'success',
            message: 'Product updated successfully',
            data: {
                product: {
                    ...updatedProduct[0],
                    variants: updatedVariants
                }
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();

        res.status(500).json({
            status: 'error',
            message: 'Failed to update product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * DELETE /api/products/:id
 * Delete product (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product used in orders?
        // Constraints will typically handle this, but let's be graceful.

        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Product deleted successfully'
        });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                status: 'error',
                message: 'Cannot delete product because it has been ordered. Consider archiving it instead.'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to delete product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
