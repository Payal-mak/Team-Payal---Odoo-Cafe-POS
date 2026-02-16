const express = require('express');
const router = express.Router();
const { getTerminals, createTerminal, getTerminal, updateTerminal, deleteTerminal } = require('../controllers/terminalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getTerminals);
router.post('/', protect, authorize('admin'), createTerminal);
router.get('/:id', protect, getTerminal);
router.put('/:id', protect, authorize('admin'), updateTerminal);
router.delete('/:id', protect, authorize('admin'), deleteTerminal);

module.exports = router;
