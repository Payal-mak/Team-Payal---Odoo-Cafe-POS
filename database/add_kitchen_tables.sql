USE odoo_cafe_pos;

-- Kitchen Tickets table
CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status ENUM(
        'to_cook',
        'preparing',
        'completed'
    ) NOT NULL DEFAULT 'to_cook',
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

-- Kitchen Ticket Items table
CREATE TABLE IF NOT EXISTS kitchen_ticket_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    order_item_id INT,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    prepared TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (ticket_id) REFERENCES kitchen_tickets (id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE SET NULL
);

-- Payments table (needed by PaymentModal)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method_id INT NOT NULL DEFAULT 1,
    payment_type ENUM('cash', 'card', 'upi') NOT NULL DEFAULT 'cash',
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM(
        'pending',
        'completed',
        'failed'
    ) NOT NULL DEFAULT 'completed',
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

-- Order items table (if not exists)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    kitchen_status ENUM(
        'pending',
        'to_cook',
        'preparing',
        'ready'
    ) DEFAULT 'pending',
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

-- Add missing columns to orders table if they don't exist
ALTER TABLE orders
MODIFY COLUMN status ENUM(
    'draft',
    'sent_to_kitchen',
    'preparing',
    'completed',
    'paid',
    'cancelled'
) NOT NULL DEFAULT 'draft';