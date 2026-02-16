-- ============================================================
-- Odoo Cafe POS - Complete Database Schema
-- Database: odoo_cafe_pos
-- Description: Full-stack Restaurant Point of Sale System
-- ============================================================

-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS odoo_cafe_pos;

CREATE DATABASE odoo_cafe_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE odoo_cafe_pos;

-- ============================================================
-- 1. USERS TABLE
-- Manages system users with role-based access
-- ============================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password using bcrypt',
    full_name VARCHAR(255) NOT NULL,
    role ENUM(
        'admin',
        'cashier',
        'kitchen_staff'
    ) NOT NULL DEFAULT 'cashier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 2. POS TERMINALS TABLE
-- Manages physical POS terminal devices
-- ============================================================
CREATE TABLE pos_terminals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'closed',
    last_session_date DATETIME NULL,
    last_closing_amount DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 3. POS SESSIONS TABLE
-- Tracks individual POS terminal sessions
-- ============================================================
CREATE TABLE pos_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    terminal_id INT NOT NULL,
    user_id INT NOT NULL,
    opened_at DATETIME NOT NULL,
    closed_at DATETIME NULL,
    opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    closing_balance DECIMAL(10, 2) NULL,
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    FOREIGN KEY (terminal_id) REFERENCES pos_terminals (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_terminal_id (terminal_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_opened_at (opened_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 4. CATEGORIES TABLE
-- Product categories for menu organization
-- ============================================================
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#2D5F5D' COMMENT 'Hex color code',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 5. PRODUCTS TABLE
-- Menu items/products available for sale
-- ============================================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit ENUM('Unit', 'Kg', 'Litre') NOT NULL DEFAULT 'Unit',
    tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_category_id (category_id),
    INDEX idx_is_active (is_active),
    INDEX idx_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 6. PRODUCT VARIANTS TABLE
-- Product variations (size, pack, etc.)
-- ============================================================
CREATE TABLE product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL COMMENT 'e.g., Size, Pack, Temperature',
    attribute_value VARCHAR(100) NOT NULL COMMENT 'e.g., Small, 6 items, Hot',
    extra_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_product_id (product_id),
    UNIQUE KEY unique_variant (
        product_id,
        attribute_name,
        attribute_value
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 7. FLOORS TABLE
-- Restaurant floor layout management
-- ============================================================
CREATE TABLE floors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 8. TABLES TABLE
-- Restaurant tables/seating areas
-- ============================================================
CREATE TABLE tables (
    id INT PRIMARY KEY AUTO_INCREMENT,
    floor_id INT NOT NULL,
    table_number INT NOT NULL,
    seats INT NOT NULL DEFAULT 4,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status ENUM(
        'available',
        'occupied',
        'reserved'
    ) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (floor_id) REFERENCES floors (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_floor_id (floor_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_table_per_floor (floor_id, table_number)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 9. CUSTOMERS TABLE
-- Customer information and loyalty tracking
-- ============================================================
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    zip_code VARCHAR(20) NULL,
    total_sales DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_name (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 10. ORDERS TABLE
-- Main orders/transactions table
-- ============================================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    session_id INT NOT NULL,
    table_id INT NULL,
    customer_id INT NULL,
    user_id INT NOT NULL,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM(
        'draft',
        'sent_to_kitchen',
        'preparing',
        'completed',
        'paid',
        'cancelled'
    ) NOT NULL DEFAULT 'draft',
    payment_status ENUM('unpaid', 'paid', 'partial') NOT NULL DEFAULT 'unpaid',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES pos_sessions (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables (id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_order_number (order_number),
    INDEX idx_session_id (session_id),
    INDEX idx_table_id (table_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_date (order_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 11. ORDER ITEMS TABLE
-- Individual items within an order
-- ============================================================
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL COMMENT 'Snapshot of product name at time of order',
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    notes TEXT NULL,
    kitchen_status ENUM(
        'pending',
        'to_cook',
        'preparing',
        'completed'
    ) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_kitchen_status (kitchen_status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 12. ORDER ITEM VARIANTS TABLE
-- Variants selected for each order item
-- ============================================================
CREATE TABLE order_item_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_item_id INT NOT NULL,
    variant_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(100) NOT NULL,
    extra_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_order_item_id (order_item_id),
    INDEX idx_variant_id (variant_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 13. PAYMENTS TABLE
-- Payment transactions for orders
-- ============================================================
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'bank') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    upi_id VARCHAR(255) NULL,
    transaction_reference VARCHAR(255) NULL,
    status ENUM(
        'pending',
        'completed',
        'failed'
    ) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_payment_method (payment_method),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 14. PAYMENT METHODS TABLE
-- Available payment methods configuration
-- ============================================================
CREATE TABLE payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('cash', 'card', 'upi', 'bank') NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    upi_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_is_enabled (is_enabled)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- 15. MOBILE ORDERS TABLE
-- QR code based mobile ordering system
-- ============================================================
CREATE TABLE mobile_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique token for QR code',
    table_id INT NOT NULL,
    order_id INT NULL,
    status ENUM(
        'active',
        'completed',
        'expired'
    ) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (table_id) REFERENCES tables (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_token (token),
    INDEX idx_table_id (table_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================
-- SAMPLE DATA INSERTION
-- Initial seed data for testing and development
-- ============================================================

-- Insert default admin user (password: admin123)
INSERT INTO
    users (
        email,
        password,
        full_name,
        role
    )
VALUES (
        'admin@odoocafe.com',
        '$2b$10$rKZvVqZ5hX5qX5qX5qX5qOqX5qX5qX5qX5qX5qX5qX5qX5qX5qX5q',
        'Admin User',
        'admin'
    ),
    (
        'cashier@odoocafe.com',
        '$2b$10$rKZvVqZ5hX5qX5qX5qX5qOqX5qX5qX5qX5qX5qX5qX5qX5qX5qX5q',
        'Cashier User',
        'cashier'
    ),
    (
        'kitchen@odoocafe.com',
        '$2b$10$rKZvVqZ5hX5qX5qX5qX5qOqX5qX5qX5qX5qX5qX5qX5qX5qX5qX5q',
        'Kitchen Staff',
        'kitchen_staff'
    );

-- Insert default POS terminal
INSERT INTO
    pos_terminals (name, status)
VALUES ('Main Counter', 'closed'),
    ('Drive-Through', 'closed');

-- Insert product categories
INSERT INTO
    categories (name, color, display_order)
VALUES ('Coffee', '#6F4E37', 1),
    ('Tea', '#D2691E', 2),
    ('Beverages', '#4169E1', 3),
    ('Snacks', '#FF6347', 4),
    ('Desserts', '#FFB6C1', 5),
    ('Breakfast', '#FFD700', 6);

-- Insert sample products
INSERT INTO
    products (
        name,
        category_id,
        price,
        unit,
        tax_percentage,
        description,
        is_active
    )
VALUES
    -- Coffee
    (
        'Espresso',
        1,
        120.00,
        'Unit',
        5.00,
        'Strong and bold espresso shot',
        TRUE
    ),
    (
        'Cappuccino',
        1,
        150.00,
        'Unit',
        5.00,
        'Espresso with steamed milk foam',
        TRUE
    ),
    (
        'Latte',
        1,
        160.00,
        'Unit',
        5.00,
        'Smooth espresso with steamed milk',
        TRUE
    ),
    (
        'Americano',
        1,
        130.00,
        'Unit',
        5.00,
        'Espresso with hot water',
        TRUE
    ),
    (
        'Mocha',
        1,
        180.00,
        'Unit',
        5.00,
        'Chocolate flavored coffee',
        TRUE
    ),

-- Tea
(
    'Masala Chai',
    2,
    80.00,
    'Unit',
    5.00,
    'Traditional Indian spiced tea',
    TRUE
),
(
    'Green Tea',
    2,
    90.00,
    'Unit',
    5.00,
    'Healthy green tea',
    TRUE
),
(
    'Lemon Tea',
    2,
    85.00,
    'Unit',
    5.00,
    'Refreshing lemon tea',
    TRUE
),

-- Beverages
(
    'Fresh Juice',
    3,
    100.00,
    'Unit',
    5.00,
    'Freshly squeezed juice',
    TRUE
),
(
    'Smoothie',
    3,
    150.00,
    'Unit',
    5.00,
    'Fruit smoothie',
    TRUE
),
(
    'Cold Coffee',
    3,
    140.00,
    'Unit',
    5.00,
    'Chilled coffee drink',
    TRUE
),

-- Snacks
(
    'Sandwich',
    4,
    120.00,
    'Unit',
    5.00,
    'Fresh vegetable sandwich',
    TRUE
),
(
    'Burger',
    4,
    150.00,
    'Unit',
    5.00,
    'Classic burger',
    TRUE
),
(
    'French Fries',
    4,
    80.00,
    'Unit',
    5.00,
    'Crispy french fries',
    TRUE
),

-- Desserts
(
    'Chocolate Cake',
    5,
    120.00,
    'Unit',
    5.00,
    'Rich chocolate cake slice',
    TRUE
),
(
    'Brownie',
    5,
    100.00,
    'Unit',
    5.00,
    'Fudgy chocolate brownie',
    TRUE
),
(
    'Ice Cream',
    5,
    90.00,
    'Unit',
    5.00,
    'Creamy ice cream',
    TRUE
);

-- Insert product variants
INSERT INTO
    product_variants (
        product_id,
        attribute_name,
        attribute_value,
        extra_price
    )
VALUES
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

-- Temperature options
( 11, 'Temperature', 'Hot', 0.00 ), ( 11, 'Temperature', 'Cold', 10.00 );

-- Insert floors
INSERT INTO
    floors (name)
VALUES ('Ground Floor'),
    ('First Floor'),
    ('Outdoor Seating');

-- Insert tables
INSERT INTO
    tables (
        floor_id,
        table_number,
        seats,
        status
    )
VALUES
    -- Ground Floor
    (1, 1, 2, 'available'),
    (1, 2, 4, 'available'),
    (1, 3, 4, 'available'),
    (1, 4, 6, 'available'),
    (1, 5, 2, 'available'),

-- First Floor
(2, 1, 4, 'available'),
(2, 2, 4, 'available'),
(2, 3, 6, 'available'),
(2, 4, 8, 'available'),

-- Outdoor Seating
(3, 1, 2, 'available'),
(3, 2, 4, 'available'),
(3, 3, 4, 'available');

-- Insert default payment methods
INSERT INTO
    payment_methods (
        name,
        type,
        is_enabled,
        upi_id
    )
VALUES ('Cash', 'cash', TRUE, NULL),
    (
        'Credit/Debit Card',
        'card',
        TRUE,
        NULL
    ),
    (
        'UPI Payment',
        'upi',
        TRUE,
        'odoocafe@upi'
    ),
    (
        'Bank Transfer',
        'bank',
        TRUE,
        NULL
    );

-- Insert sample customer
INSERT INTO
    customers (
        name,
        phone,
        email,
        city,
        state,
        country
    )
VALUES (
        'Walk-in Customer',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    ),
    (
        'John Doe',
        '+919876543210',
        'john@example.com',
        'Mumbai',
        'Maharashtra',
        'India'
    ),
    (
        'Jane Smith',
        '+919876543211',
        'jane@example.com',
        'Delhi',
        'Delhi',
        'India'
    );

-- ============================================================
-- USEFUL VIEWS FOR REPORTING
-- ============================================================

-- View: Active Orders Summary
CREATE VIEW v_active_orders AS
SELECT
    o.id,
    o.order_number,
    o.order_date,
    t.table_number,
    f.name AS floor_name,
    u.full_name AS cashier_name,
    o.total_amount,
    o.status,
    o.payment_status,
    COUNT(oi.id) AS item_count
FROM
    orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN floors f ON t.floor_id = f.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE
    o.status != 'cancelled'
    AND o.payment_status != 'paid'
GROUP BY
    o.id;

-- View: Daily Sales Summary
CREATE VIEW v_daily_sales AS
SELECT
    DATE(order_date) AS sale_date,
    COUNT(DISTINCT id) AS total_orders,
    SUM(subtotal) AS total_subtotal,
    SUM(tax_amount) AS total_tax,
    SUM(total_amount) AS total_revenue
FROM orders
WHERE
    status != 'cancelled'
GROUP BY
    DATE(order_date);

-- View: Product Sales Summary
CREATE VIEW v_product_sales AS
SELECT
    p.id,
    p.name,
    c.name AS category_name,
    COUNT(oi.id) AS times_ordered,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.total) AS total_revenue
FROM
    products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
WHERE
    o.status != 'cancelled'
GROUP BY
    p.id;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- Procedure: Create New Order
DELIMITER / /

CREATE PROCEDURE sp_create_order(
    IN p_session_id INT,
    IN p_table_id INT,
    IN p_customer_id INT,
    IN p_user_id INT,
    OUT p_order_id INT,
    OUT p_order_number VARCHAR(50)
)
BEGIN
    DECLARE v_order_number VARCHAR(50);
    
    -- Generate order number
    SET v_order_number = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    
    -- Insert order
    INSERT INTO orders (order_number, session_id, table_id, customer_id, user_id, order_date)
    VALUES (v_order_number, p_session_id, p_table_id, p_customer_id, p_user_id, NOW());
    
    SET p_order_id = LAST_INSERT_ID();
    SET p_order_number = v_order_number;
    
    -- Update table status if table is assigned
    IF p_table_id IS NOT NULL THEN
        UPDATE tables SET status = 'occupied' WHERE id = p_table_id;
    END IF;
END //

DELIMITER;

-- Procedure: Calculate Order Total
DELIMITER / /

CREATE PROCEDURE sp_calculate_order_total(IN p_order_id INT)
BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_tax_amount DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    
    -- Calculate totals from order items
    SELECT 
        COALESCE(SUM(subtotal), 0),
        COALESCE(SUM(tax_amount), 0),
        COALESCE(SUM(total), 0)
    INTO v_subtotal, v_tax_amount, v_total
    FROM order_items
    WHERE order_id = p_order_id;
    
    -- Update order
    UPDATE orders 
    SET subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total
    WHERE id = p_order_id;
END //

DELIMITER;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Update customer total sales after payment
DELIMITER / /

CREATE TRIGGER tr_update_customer_sales
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE v_customer_id INT;
    
    SELECT customer_id INTO v_customer_id
    FROM orders
    WHERE id = NEW.order_id;
    
    IF v_customer_id IS NOT NULL AND NEW.status = 'completed' THEN
        UPDATE customers
        SET total_sales = total_sales + NEW.amount
        WHERE id = v_customer_id;
    END IF;
END //

DELIMITER;

-- Trigger: Update order payment status
DELIMITER / /

CREATE TRIGGER tr_update_order_payment_status
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_paid_amount DECIMAL(10,2);
    
    SELECT total_amount INTO v_total_amount
    FROM orders
    WHERE id = NEW.order_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
    FROM payments
    WHERE order_id = NEW.order_id AND status = 'completed';
    
    IF v_paid_amount >= v_total_amount THEN
        UPDATE orders SET payment_status = 'paid', status = 'paid' WHERE id = NEW.order_id;
    ELSEIF v_paid_amount > 0 THEN
        UPDATE orders SET payment_status = 'partial' WHERE id = NEW.order_id;
    END IF;
END //

DELIMITER;

-- ============================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- (Already added inline with table definitions)
-- ============================================================

-- ============================================================
-- DATABASE SETUP COMPLETE
-- ============================================================

SELECT 'Database schema created successfully!' AS Status;

SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE
    table_schema = 'odoo_cafe_pos';