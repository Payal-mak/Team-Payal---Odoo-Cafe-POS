const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, getCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCustomers);
router.post('/', protect, createCustomer);
router.get('/:id', protect, getCustomer);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

module.exports = router;
