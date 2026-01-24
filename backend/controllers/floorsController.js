import { query } from '../config/database.js';

// @desc    Get all floors with tables for a terminal
// @route   GET /api/floors/:terminalId
// @access  Private
export const getFloors = async (req, res) => {
    try {
        const { terminalId } = req.params;

        // Get floors
        const floors = await query(
            'SELECT * FROM floors WHERE pos_config_id = ? ORDER BY created_at',
            [terminalId]
        );

        // Get tables for each floor
        for (let floor of floors) {
            const tables = await query(
                'SELECT * FROM `tables` WHERE floor_id = ? ORDER BY number',
                [floor.id]
            );
            floor.tables = tables;
        }

        res.json({
            success: true,
            data: floors
        });
    } catch (error) {
        console.error('Get floors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching floors',
            error: error.message
        });
    }
};

// @desc    Create new floor
// @route   POST /api/floors
// @access  Private
export const createFloor = async (req, res) => {
    try {
        const { pos_config_id, name } = req.body;

        if (!pos_config_id || !name) {
            return res.status(400).json({
                success: false,
                message: 'Terminal ID and floor name are required'
            });
        }

        const result = await query(
            'INSERT INTO floors (pos_config_id, name) VALUES (?, ?)',
            [pos_config_id, name]
        );

        res.status(201).json({
            success: true,
            message: 'Floor created successfully',
            data: {
                id: result.insertId,
                pos_config_id,
                name
            }
        });
    } catch (error) {
        console.error('Create floor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating floor',
            error: error.message
        });
    }
};

// @desc    Delete floor
// @route   DELETE /api/floors/:id
// @access  Private
export const deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM floors WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Floor deleted successfully'
        });
    } catch (error) {
        console.error('Delete floor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting floor',
            error: error.message
        });
    }
};

// @desc    Create new table
// @route   POST /api/floors/tables
// @access  Private
export const createTable = async (req, res) => {
    try {
        const { floor_id, number, seats, active, appointment_resource } = req.body;

        if (!floor_id || !number || !seats) {
            return res.status(400).json({
                success: false,
                message: 'Floor ID, table number, and seats are required'
            });
        }

        const result = await query(
            'INSERT INTO `tables` (floor_id, number, seats, active, appointment_resource) VALUES (?, ?, ?, ?, ?)',
            [floor_id, number, seats, active !== undefined ? active : 1, appointment_resource || null]
        );

        res.status(201).json({
            success: true,
            message: 'Table created successfully',
            data: {
                id: result.insertId,
                floor_id,
                number,
                seats,
                active: active !== undefined ? active : 1
            }
        });
    } catch (error) {
        console.error('Create table error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating table',
            error: error.message
        });
    }
};

// @desc    Update table
// @route   PUT /api/floors/tables/:id
// @access  Private
export const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { number, seats, active, appointment_resource } = req.body;

        await query(
            'UPDATE `tables` SET number = ?, seats = ?, active = ?, appointment_resource = ? WHERE id = ?',
            [number, seats, active ? 1 : 0, appointment_resource || null, id]
        );

        res.json({
            success: true,
            message: 'Table updated successfully'
        });
    } catch (error) {
        console.error('Update table error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating table',
            error: error.message
        });
    }
};

// @desc    Delete tables
// @route   DELETE /api/floors/tables
// @access  Private
export const deleteTables = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide table IDs to delete'
            });
        }

        const placeholders = ids.map(() => '?').join(',');
        await query(`DELETE FROM \`tables\` WHERE id IN (${placeholders})`, ids);

        res.json({
            success: true,
            message: 'Tables deleted successfully'
        });
    } catch (error) {
        console.error('Delete tables error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting tables',
            error: error.message
        });
    }
};

// @desc    Duplicate table
// @route   POST /api/floors/tables/:id/duplicate
// @access  Private
export const duplicateTable = async (req, res) => {
    try {
        const { id } = req.params;

        // Get original table
        const tables = await query('SELECT * FROM `tables` WHERE id = ?', [id]);

        if (tables.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        const table = tables[0];

        // Find next available table number
        const maxNumber = await query(
            'SELECT MAX(number) as max_num FROM `tables` WHERE floor_id = ?',
            [table.floor_id]
        );

        const newNumber = (maxNumber[0].max_num || 0) + 1;

        // Create duplicate
        const result = await query(
            'INSERT INTO `tables` (floor_id, number, seats, active, appointment_resource) VALUES (?, ?, ?, ?, ?)',
            [table.floor_id, newNumber, table.seats, table.active, table.appointment_resource]
        );

        res.status(201).json({
            success: true,
            message: 'Table duplicated successfully',
            data: {
                id: result.insertId,
                number: newNumber
            }
        });
    } catch (error) {
        console.error('Duplicate table error:', error);
        res.status(500).json({
            success: false,
            message: 'Error duplicating table',
            error: error.message
        });
    }
};
