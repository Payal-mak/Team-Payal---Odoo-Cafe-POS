import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const addTokenColumn = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('Connecting to database...');
        await connection.query('USE odoo_cafe_pos');

        console.log('Adding self_order_token column to tables...');
        try {
            await connection.query(`
                ALTER TABLE tables 
                ADD COLUMN self_order_token VARCHAR(64) NULL UNIQUE
            `);
            console.log('Column added successfully.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists.');
            } else {
                throw err;
            }
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
};

addTokenColumn();
