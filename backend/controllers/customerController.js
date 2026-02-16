const { promisePool } = require('../config/database');

// Get all customers
exports.getCustomers = async (req, res, next) => {
    try {
        const [customers] = await promisePool.query('SELECT * FROM customers ORDER BY created_at DESC');
        res.status(200).json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        next(error);
    }
};

// Create customer
exports.createCustomer = async (req, res, next) => {
    try {
        const { name, phone, email, address, city, state, country, zip_code } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Please provide customer name' });

        const [result] = await promisePool.query(
            'INSERT INTO customers (name, phone, email, address, city, state, country, zip_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, phone, email, address, city, state, country, zip_code]
        );
        const [customers] = await promisePool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);

        res.status(201).json({ success: true, message: 'Customer created successfully', data: customers[0] });
    } catch (error) {
        next(error);
    }
};

// Get customer details
exports.getCustomer = async (req, res, next) => {
    try {
        const [customers] = await promisePool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (customers.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });

        res.status(200).json({ success: true, data: customers[0] });
    } catch (error) {
        next(error);
    }
};

// Update customer
exports.updateCustomer = async (req, res, next) => {
    try {
        const { name, phone, email, address, city, state, country, zip_code } = req.body;
        const updateFields = [];
        const updateValues = [];

        if (name) { updateFields.push('name = ?'); updateValues.push(name); }
        if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
        if (email !== undefined) { updateFields.push('email = ?'); updateValues.push(email); }
        if (address !== undefined) { updateFields.push('address = ?'); updateValues.push(address); }
        if (city !== undefined) { updateFields.push('city = ?'); updateValues.push(city); }
        if (state !== undefined) { updateFields.push('state = ?'); updateValues.push(state); }
        if (country !== undefined) { updateFields.push('country = ?'); updateValues.push(country); }
        if (zip_code !== undefined) { updateFields.push('zip_code = ?'); updateValues.push(zip_code); }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updateValues.push(req.params.id);
        await promisePool.query(`UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        const [customers] = await promisePool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);

        res.status(200).json({ success: true, message: 'Customer updated successfully', data: customers[0] });
    } catch (error) {
        next(error);
    }
};

// Delete customer
exports.deleteCustomer = async (req, res, next) => {
    try {
        const [result] = await promisePool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Customer not found' });

        res.status(200).json({ success: true, message: 'Customer deleted successfully', data: {} });
    } catch (error) {
        next(error);
    }
};
