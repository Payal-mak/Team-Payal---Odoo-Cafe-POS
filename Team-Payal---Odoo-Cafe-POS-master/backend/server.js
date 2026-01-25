import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import floorsRoutes from './routes/floors.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import sessionRoutes from './routes/session.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import paymentRoutes from './routes/payment.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Odoo Cafe POS Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api', productsRoutes);
app.use('/api', floorsRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', sessionRoutes);
app.use('/api', ordersRoutes);
app.use('/api', paymentRoutes);

// Start Server
const startServer = async () => {
    // Connect to Database
    const isConnected = await testConnection();

    if (isConnected) {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use.`);
                console.error(`💡 Please either:`);
                console.error(`   1. Stop the process using port ${PORT}`);
                console.error(`   2. Set a different PORT in .env file (e.g., PORT=5002)`);
                console.error(`   3. Kill the process: taskkill /PID <process_id> /F`);
                process.exit(1);
            } else {
                console.error('❌ Server error:', err);
                process.exit(1);
            }
        });
    } else {
        console.error('❌ Failed to connect to database. Server not started.');
        process.exit(1);
    }
};

startServer();
