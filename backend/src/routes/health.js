import express from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Database connection health check
router.get('/db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 as test');
        res.json({
            status: 'success',
            message: 'Database connection is healthy',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Verify database tables
router.get('/tables', async (req, res) => {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);

        res.json({
            status: 'success',
            message: 'Database tables retrieved successfully',
            count: tableNames.length,
            tables: tableNames,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve tables',
            error: error.message
        });
    }
});

export default router;
