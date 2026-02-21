const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Auth validation rules
const registerValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    handleValidationErrors
];


const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

// Product validation rules
const productValidation = [
    body('name').notEmpty().withMessage('Product name is required'),
    body('category_id').isInt().withMessage('Valid category ID is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    handleValidationErrors
];

// Order validation rules
const orderValidation = [
    body('session_id').isInt().withMessage('Valid session ID is required'),
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    handleValidationErrors
];

// Payment validation rules
const paymentValidation = [
    body('order_id').isInt().withMessage('Valid order ID is required'),
    body('payment_method').isIn(['cash', 'card', 'upi', 'bank']).withMessage('Invalid payment method'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    handleValidationErrors
];

module.exports = {
    registerValidation,
    loginValidation,
    productValidation,
    orderValidation,
    paymentValidation,
    handleValidationErrors
};
