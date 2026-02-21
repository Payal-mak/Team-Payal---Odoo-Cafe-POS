const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedDatabase = async () => {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'odoo_cafe_pos'
        });

        console.log('🔗 Connected to database');

        // Clear existing data (in correct order due to foreign keys)
        console.log('🗑️  Clearing existing data...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE order_item_variants');
        await connection.query('TRUNCATE TABLE order_items');
        await connection.query('TRUNCATE TABLE payments');
        await connection.query('TRUNCATE TABLE orders');
        await connection.query('TRUNCATE TABLE customers');
        await connection.query('TRUNCATE TABLE tables');
        await connection.query('TRUNCATE TABLE floors');
        await connection.query('TRUNCATE TABLE product_variants');
        await connection.query('TRUNCATE TABLE products');
        await connection.query('TRUNCATE TABLE categories');
        await connection.query('TRUNCATE TABLE pos_sessions');
        await connection.query('TRUNCATE TABLE pos_terminals');
        await connection.query('TRUNCATE TABLE payment_methods');
        await connection.query('TRUNCATE TABLE users');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // ============================================================
        // 1. SEED USERS
        // ============================================================
        console.log('👤 Seeding users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        await connection.query(`
            INSERT INTO users (email, password, full_name, role) VALUES
            ('admin@odoo.com', ?, 'Admin User', 'admin'),
            ('cashier@odoo.com', ?, 'Cashier User', 'cashier'),
            ('kitchen@odoo.com', ?, 'Kitchen Staff', 'kitchen_staff')
        `, [hashedPassword, hashedPassword, hashedPassword]);

        // ============================================================
        // 2. SEED POS TERMINALS
        // ============================================================
        console.log('💻 Seeding POS terminals...');
        await connection.query(`
            INSERT INTO pos_terminals (name, status) VALUES
            ('Main Counter', 'open'),
            ('Counter 2', 'closed'),
            ('Drive-Through', 'closed')
        `);

        // ============================================================
        // 3. SEED POS SESSION (for Main Counter)
        // ============================================================
        console.log('📊 Seeding POS session...');
        await connection.query(`
            INSERT INTO pos_sessions (terminal_id, user_id, opened_at, opening_balance, status) VALUES
            (1, 1, NOW(), 1000.00, 'open')
        `);

        // ============================================================
        // 4. SEED CATEGORIES
        // ============================================================
        console.log('📁 Seeding categories...');
        await connection.query(`
            INSERT INTO categories (name, color, display_order) VALUES
            ('Coffee', '#6F4E37', 1),
            ('Tea', '#52B788', 2),
            ('Beverages', '#2D5F5D', 3),
            ('Snacks', '#F77F00', 4),
            ('Desserts', '#D62828', 5)
        `);

        // ============================================================
        // 5. SEED PRODUCTS WITH IMAGES
        // ============================================================
        console.log('🍕 Seeding products with images...');
        await connection.query(`
            INSERT INTO products (name, category_id, price, unit, tax_percentage, description, image_url, is_active) VALUES
            -- Coffee
            ('Espresso', 1, 120.00, 'Unit', 5.00, 'Strong black coffee', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400', TRUE),
            ('Cappuccino', 1, 150.00, 'Unit', 5.00, 'Espresso with steamed milk foam', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', TRUE),
            ('Latte', 1, 160.00, 'Unit', 5.00, 'Smooth espresso with steamed milk', 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400', TRUE),
            ('Americano', 1, 130.00, 'Unit', 5.00, 'Espresso with hot water', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400', TRUE),
            ('Mocha', 1, 180.00, 'Unit', 5.00, 'Chocolate flavored coffee', 'https://images.unsplash.com/photo-1607260550778-aa9d29444ce1?w=400', TRUE),
            
            -- Tea
            ('Masala Chai', 2, 80.00, 'Unit', 5.00, 'Traditional Indian spiced tea', 'https://images.unsplash.com/photo-1597318130878-ea50e2a7bb13?w=400', TRUE),
            ('Green Tea', 2, 90.00, 'Unit', 5.00, 'Healthy green tea', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', TRUE),
            ('Lemon Tea', 2, 85.00, 'Unit', 5.00, 'Refreshing lemon tea', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', TRUE),
            
            -- Beverages
            ('Fresh Juice', 3, 100.00, 'Unit', 5.00, 'Freshly squeezed juice', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', TRUE),
            ('Smoothie', 3, 150.00, 'Unit', 5.00, 'Fruit smoothie', 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400', TRUE),
            ('Cold Coffee', 3, 140.00, 'Unit', 5.00, 'Chilled coffee drink', 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', TRUE),
            
            -- Snacks
            ('Sandwich', 4, 120.00, 'Unit', 5.00, 'Fresh sandwich', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', TRUE),
            ('Burger', 4, 180.00, 'Unit', 5.00, 'Delicious burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', TRUE),
            
            -- Desserts
            ('Brownie', 5, 100.00, 'Unit', 5.00, 'Chocolate brownie', 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400', TRUE),
            ('Cake Slice', 5, 150.00, 'Unit', 5.00, 'Delicious cake slice', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', TRUE)
        `);

        // ============================================================
        // 6. SEED PRODUCT VARIANTS
        // ============================================================
        console.log('🔧 Seeding product variants...');
        await connection.query(`
            INSERT INTO product_variants (product_id, attribute_name, attribute_value, extra_price) VALUES
            -- Coffee sizes
            (1, 'Size', 'Small', 0.00),
            (1, 'Size', 'Medium', 20.00),
            (1, 'Size', 'Large', 40.00),
            (2, 'Size', 'Small', 0.00),
            (2, 'Size', 'Medium', 20.00),
            (2, 'Size', 'Large', 40.00),
            (3, 'Size', 'Small', 0.00),
            (3, 'Size', 'Medium', 20.00),
            (3, 'Size', 'Large', 40.00),
            
            -- Tea types
            (6, 'Type', 'Regular', 0.00),
            (6, 'Type', 'Special', 20.00),
            (7, 'Type', 'Regular', 0.00),
            (7, 'Type', 'Premium', 30.00)
        `);

        // ============================================================
        // 7. SEED FLOORS
        // ============================================================
        console.log('🏢 Seeding floors...');
        await connection.query(`
            INSERT INTO floors (name) VALUES
            ('Ground Floor'),
            ('First Floor'),
            ('Terrace')
        `);

        // ============================================================
        // 8. SEED TABLES
        // ============================================================
        console.log('🪑 Seeding tables...');
        await connection.query(`
            INSERT INTO tables (floor_id, table_number, seats, status, is_active) VALUES
            -- Ground Floor
            (1, 1, 4, 'available', TRUE),
            (1, 2, 4, 'available', TRUE),
            (1, 3, 2, 'available', TRUE),
            (1, 4, 6, 'available', TRUE),
            (1, 5, 4, 'available', TRUE),
            
            -- First Floor
            (2, 1, 4, 'available', TRUE),
            (2, 2, 4, 'available', TRUE),
            (2, 3, 8, 'available', TRUE),
            (2, 4, 2, 'available', TRUE),
            
            -- Terrace
            (3, 1, 4, 'available', TRUE),
            (3, 2, 6, 'available', TRUE),
            (3, 3, 4, 'available', TRUE)
        `);

        // ============================================================
        // 9. SEED CUSTOMERS
        // ============================================================
        console.log('👥 Seeding customers...');
        await connection.query(`
            INSERT INTO customers (name, phone, email, address, city, state, country, zip_code) VALUES
            ('John Doe', '9876543210', 'john@example.com', '123 Main St', 'Mumbai', 'Maharashtra', 'India', '400001'),
            ('Jane Smith', '9876543211', 'jane@example.com', '456 Park Ave', 'Delhi', 'Delhi', 'India', '110001'),
            ('Bob Johnson', '9876543212', 'bob@example.com', '789 Oak Rd', 'Bangalore', 'Karnataka', 'India', '560001')
        `);

        // ============================================================
        // 10. SEED PAYMENT METHODS
        // ============================================================
        console.log('💳 Seeding payment methods...');
        await connection.query(`
            INSERT INTO payment_methods (name, type, is_enabled, upi_id) VALUES
            ('Cash', 'cash', TRUE, NULL),
            ('Card', 'digital', TRUE, NULL),
            ('UPI', 'upi', TRUE, 'merchant@upi'),
            ('PhonePe', 'upi', TRUE, 'merchant@phonepe'),
            ('Google Pay', 'upi', TRUE, 'merchant@gpay')
        `);

        console.log('✅ Database seeded successfully!');
        console.log('\n📋 Summary:');
        console.log('   - 3 Users (admin, cashier, kitchen)');
        console.log('   - 3 POS Terminals');
        console.log('   - 1 Active Session');
        console.log('   - 5 Categories');
        console.log('   - 15 Products with images');
        console.log('   - 13 Product Variants');
        console.log('   - 3 Floors');
        console.log('   - 12 Tables');
        console.log('   - 3 Customers');
        console.log('   - 5 Payment Methods');
        console.log('\n🔐 Login Credentials:');
        console.log('   Admin: admin@odoo.com / password123');
        console.log('   Cashier: cashier@odoo.com / password123');
        console.log('   Kitchen: kitchen@odoo.com / password123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
};

// Run the seed function
seedDatabase()
    .then(() => {
        console.log('\n🎉 Seeding completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Seeding failed:', error);
        process.exit(1);
    });
