const express = require('express');
const router = express.Router();
const {
    getProducts, createProduct, getProduct, updateProduct, deleteProduct,
    getProductsByCategory, getProductVariants, createProductVariant, deleteProductVariant
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Product routes
router.get('/', getProducts);
router.post('/', protect, authorize('admin'), createProduct);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// Variant routes
router.get('/:productId/variants', getProductVariants);
router.post('/:productId/variants', protect, authorize('admin'), createProductVariant);
router.delete('/:productId/variants/:id', protect, authorize('admin'), deleteProductVariant);

module.exports = router;
