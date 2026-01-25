-- Insert default POS configuration if it doesn't exist
INSERT IGNORE INTO
    pos_configs (
        id,
        name,
        cash_enabled,
        digital_enabled,
        upi_enabled,
        upi_id
    )
VALUES (
        1,
        'Main POS Terminal',
        1,
        1,
        1,
        '123@ybl'
    );

-- Insert some sample categories
INSERT IGNORE INTO
    categories (id, name, color, sequence)
VALUES (1, 'Beverages', '#3b82f6', 1),
    (2, 'Food', '#10b981', 2),
    (3, 'Desserts', '#f59e0b', 3);

-- Insert some sample products
INSERT IGNORE INTO
    products (
        id,
        name,
        category_id,
        price,
        unit,
        tax_rate,
        description,
        is_kitchen_sent
    )
VALUES (
        1,
        'Coffee',
        1,
        2.50,
        'unit',
        5.00,
        'Fresh brewed coffee',
        0
    ),
    (
        2,
        'Pizza',
        2,
        12.99,
        'unit',
        10.00,
        'Delicious pizza',
        1
    ),
    (
        3,
        'Burger',
        2,
        8.99,
        'unit',
        10.00,
        'Juicy burger',
        1
    ),
    (
        4,
        'Pasta',
        2,
        10.99,
        'unit',
        10.00,
        'Italian pasta',
        1
    ),
    (
        5,
        'Ice Cream',
        3,
        4.99,
        'unit',
        5.00,
        'Vanilla ice cream',
        0
    );