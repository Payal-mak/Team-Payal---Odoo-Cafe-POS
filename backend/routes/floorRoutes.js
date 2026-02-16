const express = require('express');
const router = express.Router();
const { getFloors, createFloor, updateFloor, deleteFloor } = require('../controllers/floorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getFloors);
router.post('/', protect, authorize('admin'), createFloor);
router.put('/:id', protect, authorize('admin'), updateFloor);
router.delete('/:id', protect, authorize('admin'), deleteFloor);

module.exports = router;
