const express = require('express');
const router = express.Router();
const { getTables, getTablesByFloor, createTable, updateTable, updateTableStatus, deleteTable } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getTables);
router.get('/floor/:floorId', protect, getTablesByFloor);
router.post('/', protect, authorize('admin'), createTable);
router.put('/:id', protect, authorize('admin'), updateTable);
router.put('/:id/status', protect, updateTableStatus);
router.delete('/:id', protect, authorize('admin'), deleteTable);

module.exports = router;
