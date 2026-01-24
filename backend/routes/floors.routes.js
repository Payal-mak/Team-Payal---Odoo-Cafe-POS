import express from 'express';
import {
    getAllFloors,
    getFloorById,
    createFloor,
    updateFloor,
    deleteFloor,
    getAllTables,
    getTablesByFloor,
    createTable,
    updateTable,
    deleteTable
} from '../controllers/floors.controller.js';

const router = express.Router();

// Floor routes
router.get('/floors', getAllFloors);
router.get('/floors/:id', getFloorById);
router.post('/floors', createFloor);
router.put('/floors/:id', updateFloor);
router.delete('/floors/:id', deleteFloor);

// Table routes
router.get('/tables', getAllTables);
router.get('/tables/floor/:floorId', getTablesByFloor);
router.post('/tables', createTable);
router.put('/tables/:id', updateTable);
router.delete('/tables/:id', deleteTable);

export default router;
