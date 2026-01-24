import pool from '../config/database.js';

// Create POS Terminal
export const createPOSTerminal = async (req, res) => {
    try {
        const { name } = req.body;
        const createdBy = req.user.userId;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Terminal name is required'
            });
        }

        // Check if terminal name already exists
        const [existing] = await pool.query(
            'SELECT id FROM pos_configs WHERE name = ?',
            [name.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A terminal with this name already exists'
            });
        }

        // Create terminal
        const [result] = await pool.query(
            'INSERT INTO pos_configs (name, created_by, created_at) VALUES (?, ?, NOW())',
            [name.trim(), createdBy]
        );

        // Get the created terminal
        const [terminal] = await pool.query(
            `SELECT pc.id, pc.name, pc.created_at, u.username as created_by_name
       FROM pos_configs pc
       LEFT JOIN users u ON pc.created_by = u.id
       WHERE pc.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'POS terminal created successfully',
            terminal: terminal[0]
        });

    } catch (error) {
        console.error('Create terminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating terminal'
        });
    }
};

// Get All POS Terminals
export const getAllPOSTerminals = async (req, res) => {
    try {
        const [terminals] = await pool.query(
            `SELECT pc.id, pc.name, pc.created_at, pc.cash_enabled, pc.digital_enabled, pc.upi_enabled, pc.upi_id, u.username as created_by_name
       FROM pos_configs pc
       LEFT JOIN users u ON pc.created_by = u.id
       ORDER BY pc.created_at DESC`
        );

        res.json({
            success: true,
            terminals
        });

    } catch (error) {
        console.error('Get terminals error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching terminals'
        });
    }
};

// Get Single POS Terminal
export const getPOSTerminal = async (req, res) => {
    try {
        const { id } = req.params;

        const [terminals] = await pool.query(
            `SELECT pc.id, pc.name, pc.created_at, pc.cash_enabled, pc.digital_enabled, pc.upi_enabled, pc.upi_id, u.username as created_by_name
       FROM pos_configs pc
       LEFT JOIN users u ON pc.created_by = u.id
       WHERE pc.id = ?`,
            [id]
        );

        if (terminals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        res.json({
            success: true,
            terminal: terminals[0]
        });

    } catch (error) {
        console.error('Get terminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching terminal'
        });
    }
};

// Delete POS Terminal
export const deletePOSTerminal = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            'DELETE FROM pos_configs WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        res.json({
            success: true,
            message: 'Terminal deleted successfully'
        });

    } catch (error) {
        console.error('Delete terminal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting terminal'
        });
    }
};

// Update POS Terminal Configuration (Payment Methods)
export const updatePOSTerminalConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { cash_enabled, digital_enabled, upi_enabled, upi_id } = req.body;

        // Check if terminal exists
        const [existing] = await pool.query(
            'SELECT id FROM pos_configs WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Terminal not found'
            });
        }

        // Construct dynamic update query
        let updateFields = [];
        let queryParams = [];

        if (typeof cash_enabled !== 'undefined') {
            updateFields.push('cash_enabled = ?');
            queryParams.push(cash_enabled ? 1 : 0);
        }
        if (typeof digital_enabled !== 'undefined') {
            updateFields.push('digital_enabled = ?');
            queryParams.push(digital_enabled ? 1 : 0);
        }
        if (typeof upi_enabled !== 'undefined') {
            updateFields.push('upi_enabled = ?');
            queryParams.push(upi_enabled ? 1 : 0);
        }
        if (typeof upi_id !== 'undefined') {
            updateFields.push('upi_id = ?');
            queryParams.push(upi_id);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No configuration fields provided'
            });
        }

        queryParams.push(id);

        const query = `UPDATE pos_configs SET ${updateFields.join(', ')} WHERE id = ?`;

        await pool.query(query, queryParams);

        // Get updated terminal
        const [updatedTerminal] = await pool.query(
            `SELECT pc.id, pc.name, pc.created_at, pc.cash_enabled, pc.digital_enabled, pc.upi_enabled, pc.upi_id, u.username as created_by_name
       FROM pos_configs pc
       LEFT JOIN users u ON pc.created_by = u.id
       WHERE pc.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Terminal configuration updated successfully',
            terminal: updatedTerminal[0]
        });

    } catch (error) {
        console.error('Update terminal config error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating terminal configuration'
        });
    }
};
