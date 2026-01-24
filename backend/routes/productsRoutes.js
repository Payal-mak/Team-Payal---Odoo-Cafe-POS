import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProducts
} from '../controllers/productsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getProducts);
router.post('/', protect, createProduct);
router.get('/:id', protect, getProductById);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.delete('/', protect, deleteProducts);

export default router;
