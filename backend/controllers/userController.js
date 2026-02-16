const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const [users] = await promisePool.query(
            'SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC'
        );

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
    try {
        const [users] = await promisePool.query(
            'SELECT id, email, full_name, role, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
    try {
        const { email, full_name, role, password } = req.body;

        // Check if user exists
        const [existingUsers] = await promisePool.query(
            'SELECT id FROM users WHERE id = ?',
            [req.params.id]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let updateQuery = 'UPDATE users SET ';
        const updateValues = [];
        const updateFields = [];

        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (full_name) {
            updateFields.push('full_name = ?');
            updateValues.push(full_name);
        }
        if (role) {
            updateFields.push('role = ?');
            updateValues.push(role);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateQuery += updateFields.join(', ') + ' WHERE id = ?';
        updateValues.push(req.params.id);

        await promisePool.query(updateQuery, updateValues);

        // Get updated user
        const [users] = await promisePool.query(
            'SELECT id, email, full_name, role, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: users[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const [result] = await promisePool.query(
            'DELETE FROM users WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
