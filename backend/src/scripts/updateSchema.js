import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const updateSchema = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'odoo_cafe_pos',
            multipleStatements: true
        });

        console.log('🔌 Connected to MySQL server');

        // Helper to add column safely
        const addColumn = async (table, definition) => {
            try {
                await connection.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
                console.log(`✅ Added column: ${definition}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⚠️  Column already exists: ${definition.split(' ')[0]}`);
                } else {
                    throw err;
                }
            }
        };

        console.log('🚀 Updating schema...');

        await addColumn('tables', "position_x INT DEFAULT 0");
        await addColumn('tables', "position_y INT DEFAULT 0");
        await addColumn('tables', "width INT DEFAULT 100");
        await addColumn('tables', "height INT DEFAULT 100");
        await addColumn('tables', "shape ENUM('square', 'round') DEFAULT 'square'");
        await addColumn('tables', "color VARCHAR(20) DEFAULT '#8b6940'");

        console.log('✅ Schema updated successfully!');

    } catch (error) {
        console.error('❌ Schema update failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

updateSchema();
