const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory, reorderCategories } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', protect, authorize('admin'), createCategory);
router.put('/reorder', protect, authorize('admin'), reorderCategories);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
