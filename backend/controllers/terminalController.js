const { promisePool } = require('../config/database');

// @desc    Get all terminals
// @route   GET /api/terminals
// @access  Private
exports.getTerminals = async (req, res, next) => {
    try {
        const [terminals] = await promisePool.query(
            'SELECT * FROM pos_terminals ORDER BY created_at DESC'
        );

        res.status(200).json({
            success: true,
            count: terminals.length,
            data: terminals
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create terminal
// @route   POST /api/terminals
// @access  Private/Admin
exports.createTerminal = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide terminal name'
            });
        }

        const [result] = await promisePool.query(
            'INSERT INTO pos_terminals (name, status) VALUES (?, ?)',
            [name, 'closed']
        );

        const [terminals] = await promisePool.query(
            'SELECT * FROM pos_terminals WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Terminal created successfully',
            data: terminals[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get terminal details
// @route   GET /api/terminals/:id
// @access  Private
exports.getTerminal = async (req, res, next) => {
    try {
        const [terminals] = await promisePool.query(
            'SELECT * FROM pos_terminals WHERE id = ?',
            [req.params.id]
        );

        if (terminals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        res.status(200).json({
            success: true,
            data: terminals[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update terminal
// @route   PUT /api/terminals/:id
// @access  Private/Admin
exports.updateTerminal = async (req, res, next) => {
    try {
        const { name, status } = req.body;

        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (status) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(req.params.id);

        await promisePool.query(
            `UPDATE pos_terminals SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        const [terminals] = await promisePool.query(
            'SELECT * FROM pos_terminals WHERE id = ?',
            [req.params.id]
        );

        res.status(200).json({
            success: true,
            message: 'Terminal updated successfully',
            data: terminals[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete terminal
// @route   DELETE /api/terminals/:id
// @access  Private/Admin
exports.deleteTerminal = async (req, res, next) => {
    try {
        const [result] = await promisePool.query(
            'DELETE FROM pos_terminals WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Terminal deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
