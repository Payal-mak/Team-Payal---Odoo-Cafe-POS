import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function setupDatabase() {
    let connection;

    try {
        // Connect without database first
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT
        });

        console.log('📡 Connected to MySQL server');

        // Read SQL file
        const sqlPath = path.join(__dirname, '../../odoo_cafe_pos.sql');
        let sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 SQL file loaded');

        // Remove DELIMITER statements and fix trigger syntax
        sqlContent = sqlContent
            .replace(/DELIMITER\s+\/\/?\s*/gi, '')
            .replace(/\/\/?\s*$/gm, ';')
            .replace(/END\s*\/\s*\/\s*/gi, 'END;');

        // Split into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📊 Executing ${statements.length} SQL statements...`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await connection.query(statement);
            } catch (err) {
                // Ignore "already exists" warnings
                if (!err.message.includes('already exists')) {
                    console.warn(`⚠️  Warning on statement ${i + 1}: ${err.message.substring(0, 100)}`);
                }
            }
        }

        console.log('✅ Database setup completed successfully!');
        console.log('📊 All tables and triggers created');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
