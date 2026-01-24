import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate input
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required: username, email, password, role'
            });
        }

        // Validate role
        const validRoles = ['pos_user', 'kitchen_user', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid role. Must be one of: pos_user, kitchen_user, admin'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'User with this email or username already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, role]
        );

        // Get the created user
        const [users] = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        const user = users[0];

        // Generate JWT token
        const token = generateToken(user);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                },
                token
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to register user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
        }

        // Find user by email or username
        const [users] = await pool.query(
            'SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = ? OR username = ?',
            [email, email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/auth/verify
 * Verify JWT token
 */
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        status: 'success',
        message: 'Token is valid',
        data: {
            user: req.user
        }
    });
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                user: users[0]
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get user information',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
