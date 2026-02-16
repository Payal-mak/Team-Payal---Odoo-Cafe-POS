const { promisePool } = require('../config/database');

// Get all floors
exports.getFloors = async (req, res, next) => {
    try {
        const [floors] = await promisePool.query('SELECT * FROM floors ORDER BY name');
        res.status(200).json({ success: true, count: floors.length, data: floors });
    } catch (error) {
        next(error);
    }
};

// Create floor
exports.createFloor = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Please provide floor name' });

        const [result] = await promisePool.query('INSERT INTO floors (name) VALUES (?)', [name]);
        const [floors] = await promisePool.query('SELECT * FROM floors WHERE id = ?', [result.insertId]);

        res.status(201).json({ success: true, message: 'Floor created successfully', data: floors[0] });
    } catch (error) {
        next(error);
    }
};

// Update floor
exports.updateFloor = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Please provide floor name' });

        await promisePool.query('UPDATE floors SET name = ? WHERE id = ?', [name, req.params.id]);
        const [floors] = await promisePool.query('SELECT * FROM floors WHERE id = ?', [req.params.id]);

        res.status(200).json({ success: true, message: 'Floor updated successfully', data: floors[0] });
    } catch (error) {
        next(error);
    }
};

// Delete floor
exports.deleteFloor = async (req, res, next) => {
    try {
        const [result] = await promisePool.query('DELETE FROM floors WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Floor not found' });

        res.status(200).json({ success: true, message: 'Floor deleted successfully', data: {} });
    } catch (error) {
        next(error);
    }
};
