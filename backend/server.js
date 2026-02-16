const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const { testConnection } = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/terminals', require('./routes/terminalRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/floors', require('./routes/floorRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/payment-methods', require('./routes/paymentRoutes'));
app.use('/api/kitchen', require('./routes/kitchenRoutes'));
app.use('/api/mobile-orders', require('./routes/mobileOrderRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Odoo Cafe POS API is running',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Odoo Cafe POS API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            users: '/api/users',
            terminals: '/api/terminals',
            sessions: '/api/sessions',
            products: '/api/products',
            categories: '/api/categories',
            floors: '/api/floors',
            tables: '/api/tables',
            customers: '/api/customers',
            orders: '/api/orders',
            payments: '/api/payments',
            kitchen: '/api/kitchen',
            mobileOrders: '/api/mobile-orders',
            reports: '/api/reports'
        }
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Join kitchen room
    socket.on('join-kitchen', () => {
        socket.join('kitchen');
        logger.info(`Socket ${socket.id} joined kitchen room`);
    });

    // Join customer display room
    socket.on('join-customer-display', () => {
        socket.join('customer-display');
        logger.info(`Socket ${socket.id} joined customer display room`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();

        if (!dbConnected) {
            logger.error('Failed to connect to database. Please check your database configuration.');
            process.exit(1);
        }

        // Start listening
        server.listen(PORT, () => {
            logger.info('');
            logger.info('╔════════════════════════════════════════════════════════╗');
            logger.info('║                                                        ║');
            logger.info('║           🚀 Odoo Cafe POS API Server 🚀              ║');
            logger.info('║                                                        ║');
            logger.info('╠════════════════════════════════════════════════════════╣');
            logger.info(`║  Server running on: http://localhost:${PORT}           ║`);
            logger.info(`║  Environment: ${process.env.NODE_ENV || 'development'}                           ║`);
            logger.info(`║  Database: ${process.env.DB_NAME}                     ║`);
            logger.info('║  WebSocket: Enabled                                    ║');
            logger.info('║                                                        ║');
            logger.info('║  API Documentation:                                    ║');
            logger.info(`║  └─ Health Check: http://localhost:${PORT}/api/health  ║`);
            logger.info(`║  └─ API Root: http://localhost:${PORT}/                ║`);
            logger.info('║                                                        ║');
            logger.info('╚════════════════════════════════════════════════════════╝');
            logger.info('');
        });
    } catch (error) {
        logger.error('Error starting server:', error.message);
        process.exit(1);
    }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

module.exports = { app, io };
