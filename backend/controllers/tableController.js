const { promisePool } = require('../config/database');

// Get all tables
exports.getTables = async (req, res, next) => {
    try {
        const [tables] = await promisePool.query(`
            SELECT t.*, f.name as floor_name
            FROM tables t
            LEFT JOIN floors f ON t.floor_id = f.id
            ORDER BY f.name, t.table_number
        `);
        res.status(200).json({ success: true, count: tables.length, data: tables });
    } catch (error) {
        next(error);
    }
};

// Get tables by floor
exports.getTablesByFloor = async (req, res, next) => {
    try {
        const [tables] = await promisePool.query(
            'SELECT * FROM tables WHERE floor_id = ? ORDER BY table_number',
            [req.params.floorId]
        );
        res.status(200).json({ success: true, count: tables.length, data: tables });
    } catch (error) {
        next(error);
    }
};

// Create table
exports.createTable = async (req, res, next) => {
    try {
        const { floor_id, table_number, seats } = req.body;
        if (!floor_id || !table_number) {
            return res.status(400).json({ success: false, message: 'Please provide floor_id and table_number' });
        }

        const [result] = await promisePool.query(
            'INSERT INTO tables (floor_id, table_number, seats) VALUES (?, ?, ?)',
            [floor_id, table_number, seats || 4]
        );
        const [tables] = await promisePool.query('SELECT * FROM tables WHERE id = ?', [result.insertId]);

        res.status(201).json({ success: true, message: 'Table created successfully', data: tables[0] });
    } catch (error) {
        next(error);
    }
};

// Update table
exports.updateTable = async (req, res, next) => {
    try {
        const { floor_id, table_number, seats, is_active } = req.body;
        const updateFields = [];
        const updateValues = [];

        if (floor_id) { updateFields.push('floor_id = ?'); updateValues.push(floor_id); }
        if (table_number) { updateFields.push('table_number = ?'); updateValues.push(table_number); }
        if (seats) { updateFields.push('seats = ?'); updateValues.push(seats); }
        if (is_active !== undefined) { updateFields.push('is_active = ?'); updateValues.push(is_active); }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updateValues.push(req.params.id);
        await promisePool.query(`UPDATE tables SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        const [tables] = await promisePool.query('SELECT * FROM tables WHERE id = ?', [req.params.id]);

        res.status(200).json({ success: true, message: 'Table updated successfully', data: tables[0] });
    } catch (error) {
        next(error);
    }
};

// Update table status
exports.updateTableStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, message: 'Please provide status' });

        await promisePool.query('UPDATE tables SET status = ? WHERE id = ?', [status, req.params.id]);
        const [tables] = await promisePool.query('SELECT * FROM tables WHERE id = ?', [req.params.id]);

        res.status(200).json({ success: true, message: 'Table status updated successfully', data: tables[0] });
    } catch (error) {
        next(error);
    }
};

// Delete table
exports.deleteTable = async (req, res, next) => {
    try {
        const [result] = await promisePool.query('DELETE FROM tables WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Table not found' });

        res.status(200).json({ success: true, message: 'Table deleted successfully', data: {} });
    } catch (error) {
        next(error);
    }
};
