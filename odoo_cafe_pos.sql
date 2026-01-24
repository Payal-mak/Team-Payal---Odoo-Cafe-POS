-- Create the database
CREATE DATABASE IF NOT EXISTS odoo_cafe_pos;

USE odoo_cafe_pos;

-- =====================================================================
-- 1. Users Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'pos_user',
        'kitchen_user',
        'admin'
    ) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- =====================================================================
-- 2. Categories Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(20),
    sequence INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- =====================================================================
-- 3. Products Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL,
    unit ENUM('kg', 'unit', 'litre') NOT NULL,
    tax_rate DECIMAL(5, 2) NOT NULL,
    description TEXT,
    is_kitchen_sent TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- =====================================================================
-- 4. Product Variants Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    extra_price DECIMAL(10, 2) DEFAULT 0.00,
    unit ENUM('kg', 'unit', 'litre') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- =====================================================================
-- 5. POS Configurations (Terminals) Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS pos_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_by INT,
    last_open_session_id INT,
    last_closing_sale_amount DECIMAL(10, 2) DEFAULT 0.00,
    upi_id VARCHAR(255),
    cash_enabled TINYINT(1) DEFAULT 1,
    digital_enabled TINYINT(1) DEFAULT 1,
    upi_enabled TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;
-- =====================================================================
-- 6. Floors Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS floors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pos_config_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pos_config_id) REFERENCES pos_configs (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- =====================================================================
-- 7. Tables Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS `tables` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor_id INT NOT NULL,
    number INT NOT NULL,
    seats INT NOT NULL,
    active TINYINT(1) DEFAULT 1,
    appointment_resource VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (floor_id) REFERENCES floors (id) ON DELETE CASCADE,
    UNIQUE KEY unique_table_per_floor (floor_id, number)
) ENGINE = InnoDB;

-- =====================================================================
-- 8. POS Sessions Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS pos_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pos_config_id INT NOT NULL,
    responsible_user_id INT,
    open_date TIMESTAMP NOT NULL,
    close_date TIMESTAMP NULL,
    sale_amount DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('open', 'closed') DEFAULT 'open',
    FOREIGN KEY (pos_config_id) REFERENCES pos_configs (id) ON DELETE CASCADE,
    FOREIGN KEY (responsible_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- =====================================================================
-- 9. Customers Table (Optional)
-- =====================================================================
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- =====================================================================
-- 10. Orders Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id INT,
    table_id INT,
    customer_id INT,
    customer_name VARCHAR(255),
    status ENUM('draft', 'paid') DEFAULT 'draft',
    kitchen_stage ENUM(
        'to_cook',
        'preparing',
        'completed'
    ) DEFAULT 'to_cook',
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'digital', 'upi') DEFAULT NULL,
    payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES pos_sessions (id) ON DELETE SET NULL,
    FOREIGN KEY (table_id) REFERENCES `tables` (id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- =====================================================================
-- 11. Order Lines Table
-- =====================================================================
CREATE TABLE IF NOT EXISTS order_lines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    is_prepared TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- =====================================================================
-- 12. Self Order Tokens Table (Optional)
-- =====================================================================
CREATE TABLE IF NOT EXISTS self_order_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    table_id INT,
    session_id INT,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES `tables` (id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES pos_sessions (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- =====================================================================
-- Optional: Trigger to auto-update order totals (MySQL syntax)
-- =====================================================================
DELIMITER /
/

DROP TRIGGER IF EXISTS update_order_totals_after_insert;

CREATE TRIGGER update_order_totals_after_insert
AFTER INSERT ON order_lines
FOR EACH ROW
BEGIN
    UPDATE orders
    SET 
        total_amount = (
            SELECT COALESCE(SUM(total), 0) 
            FROM order_lines 
            WHERE order_id = NEW.order_id
        ),
        tax_amount = (
            SELECT COALESCE(SUM(total - subtotal), 0) 
            FROM order_lines 
            WHERE order_id = NEW.order_id
        )
    WHERE id = NEW.order_id;
END
/
/

DROP TRIGGER IF EXISTS update_order_totals_after_update;

CREATE TRIGGER update_order_totals_after_update
AFTER UPDATE ON order_lines
FOR EACH ROW
BEGIN
    UPDATE orders
    SET 
        total_amount = (
            SELECT COALESCE(SUM(total), 0) 
            FROM order_lines 
            WHERE order_id = NEW.order_id
        ),
        tax_amount = (
            SELECT COALESCE(SUM(total - subtotal), 0) 
            FROM order_lines 
            WHERE order_id = NEW.order_id
        )
    WHERE id = NEW.order_id;
END
/
/

DROP TRIGGER IF EXISTS update_order_totals_after_delete;

CREATE TRIGGER update_order_totals_after_delete
AFTER DELETE ON order_lines
FOR EACH ROW
BEGIN
    UPDATE orders
    SET 
        total_amount = (
            SELECT COALESCE(SUM(total), 0) 
            FROM order_lines 
            WHERE order_id = OLD.order_id
        ),
        tax_amount = (
            SELECT COALESCE(SUM(total - subtotal), 0) 
            FROM order_lines 
            WHERE order_id = OLD.order_id
        )
    WHERE id = OLD.order_id;
END
/
/

DELIMITER;