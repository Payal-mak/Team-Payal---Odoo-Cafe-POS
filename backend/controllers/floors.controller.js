import { query } from '../config/database.js';

// ============ FLOORS ============

// Get all floors with table count
export const getAllFloors = async (req, res) => {
    try {
        const floors = await query(`
            SELECT 
                f.id,
                f.pos_config_id,
                f.name,
                f.created_at,
                f.updated_at,
                COUNT(t.id) as table_count
            FROM floors f
            LEFT JOIN \`tables\` t ON f.id = t.floor_id
            GROUP BY f.id
            ORDER BY f.created_at DESC
        `);

        res.json({
            success: true,
            data: floors
        });
    } catch (error) {
        console.error('Get all floors error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch floors'
        });
    }
};

// Get single floor with all its tables
export const getFloorById = async (req, res) => {
    try {
        const { id } = req.params;

        const floors = await query('SELECT * FROM floors WHERE id = ?', [id]);

        if (floors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Floor not found'
            });
        }

        // Get tables for this floor
        const tables = await query(`
            SELECT * FROM \`tables\` 
            WHERE floor_id = ?
            ORDER BY number ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...floors[0],
                tables
            }
        });
    } catch (error) {
        console.error('Get floor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch floor'
        });
    }
};

// Create new floor
export const createFloor = async (req, res) => {
    try {
        const { pos_config_id, name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Floor name is required'
            });
        }

        // For now, use default pos_config_id = 1 if not provided
        const configId = pos_config_id || 1;

        const result = await query(
            'INSERT INTO floors (pos_config_id, name) VALUES (?, ?)',
            [configId, name]
        );

        res.status(201).json({
            success: true,
            message: 'Floor created successfully',
            data: {
                id: result.insertId,
                pos_config_id: configId,
                name
            }
        });
    } catch (error) {
        console.error('Create floor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create floor'
        });
    }
};

// Update floor
export const updateFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, pos_config_id } = req.body;

        const existingFloor = await query('SELECT id FROM floors WHERE id = ?', [id]);
        if (existingFloor.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Floor not found'
            });
        }

        await query(
            'UPDATE floors SET name = ?, pos_config_id = ? WHERE id = ?',
            [name, pos_config_id || 1, id]
        );

        res.json({
            success: true,
            message: 'Floor updated successfully'
        });
    } catch (error) {
        console.error('Update floor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update floor'
        });
    }
};

// Delete floor
export const deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;

        const existingFloor = await query('SELECT id FROM floors WHERE id = ?', [id]);
        if (existingFloor.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Floor not found'
            });
        }

        await query('DELETE FROM floors WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Floor deleted successfully'
        });
    } catch (error) {
        console.error('Delete floor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete floor'
        });
    }
};

// ============ TABLES ============

// Get all tables
export const getAllTables = async (req, res) => {
    try {
        const tables = await query(`
            SELECT 
                t.*,
                f.name as floor_name
            FROM \`tables\` t
            LEFT JOIN floors f ON t.floor_id = f.id
            ORDER BY f.name, t.number ASC
        `);

        res.json({
            success: true,
            data: tables
        });
    } catch (error) {
        console.error('Get all tables error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tables'
        });
    }
};

// Get tables by floor ID
export const getTablesByFloor = async (req, res) => {
    try {
        const { floorId } = req.params;

        const tables = await query(`
            SELECT * FROM \`tables\`
            WHERE floor_id = ?
            ORDER BY number ASC
        `, [floorId]);

        res.json({
            success: true,
            data: tables
        });
    } catch (error) {
        console.error('Get tables by floor error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tables'
        });
    }
};

// Create new table
export const createTable = async (req, res) => {
    try {
        const { floor_id, number, seats, active, appointment_resource } = req.body;

        if (!floor_id || !number || !seats) {
            return res.status(400).json({
                success: false,
                message: 'Floor ID, table number, and seats are required'
            });
        }

        // Check if table number already exists on this floor
        const existingTable = await query(
            'SELECT id FROM `tables` WHERE floor_id = ? AND number = ?',
            [floor_id, number]
        );

        if (existingTable.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Table number already exists on this floor'
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
                active: active !== undefined ? active : 1,
                appointment_resource
            }
        });
    } catch (error) {
        console.error('Create table error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create table'
        });
    }
};

// Update table
export const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { floor_id, number, seats, active, appointment_resource } = req.body;

        const existingTable = await query('SELECT id FROM `tables` WHERE id = ?', [id]);
        if (existingTable.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Check for duplicate table number on floor (excluding current table)
        if (floor_id && number) {
            const duplicate = await query(
                'SELECT id FROM `tables` WHERE floor_id = ? AND number = ? AND id != ?',
                [floor_id, number, id]
            );

            if (duplicate.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Table number already exists on this floor'
                });
            }
        }

        await query(
            'UPDATE `tables` SET floor_id = ?, number = ?, seats = ?, active = ?, appointment_resource = ? WHERE id = ?',
            [floor_id, number, seats, active, appointment_resource || null, id]
        );

        res.json({
            success: true,
            message: 'Table updated successfully'
        });
    } catch (error) {
        console.error('Update table error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update table'
        });
    }
};

// Delete table
export const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;

        const existingTable = await query('SELECT id FROM `tables` WHERE id = ?', [id]);
        if (existingTable.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        await query('DELETE FROM `tables` WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Table deleted successfully'
        });
    } catch (error) {
        console.error('Delete table error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete table'
        });
    }
};
