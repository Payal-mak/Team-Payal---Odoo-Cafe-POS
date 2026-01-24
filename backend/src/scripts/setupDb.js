import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupDatabase = async () => {
    let connection;
    try {
        // Create connection with multipleStatements enabled
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('🔌 Connected to MySQL server');

        // Read SQL file
        const sqlPath = path.join(__dirname, '../../../odoo_cafe_pos.sql'); // Fix: 3 levels up to reach project root
        console.log(`📂 Reading SQL file from: ${sqlPath}`);

        if (!fs.existsSync(sqlPath)) {
            throw new Error(`SQL file not found at ${sqlPath}`);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute SQL
        console.log('🚀 Executing database setup script...');
        try {
            await connection.query(sql);
            console.log('✅ Database setup completed successfully!');
        } catch (sqlError) {
            if (sqlError.code === 'ER_TABLE_EXISTS_ERROR' || sqlError.errno === 1050) {
                console.log('⚠️  Database tables already exist. Skipping setup.');
                console.log('💡 Tip: If you want to reset the database, drop it manually first.');
            } else {
                throw sqlError;
            }
        }

    } catch (error) {
        if (error.code !== 'ER_TABLE_EXISTS_ERROR' && error.errno !== 1050) {
            console.error('❌ Database setup failed:', error.message);
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

setupDatabase();
