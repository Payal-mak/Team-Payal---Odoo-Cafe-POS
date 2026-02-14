import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
} from '../controllers/categoriesController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getCategories);
router.post('/', protect, createCategory);
router.put('/reorder', protect, reorderCategories);
router.put('/:id', protect, updateCategory);
router.delete('/:id', protect, deleteCategory);

export default router;
