const express = require('express');
const router = express.Router();
const { generateToken, verifyToken, placeOrder, getMenu } = require('../controllers/mobileOrderController');
const { protect } = require('../middleware/auth');

router.post('/generate-token', protect, generateToken);
router.get('/verify/:token', verifyToken);
router.post('/:token/order', placeOrder);
router.get('/:token/menu', getMenu);

module.exports = router;
