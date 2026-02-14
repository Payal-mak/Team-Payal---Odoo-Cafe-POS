import express from 'express';
import {
    getFloors,
    createFloor,
    deleteFloor,
    createTable,
    updateTable,
    deleteTables,
    duplicateTable
} from '../controllers/floorsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:terminalId', protect, getFloors);
router.post('/', protect, createFloor);
router.delete('/:id', protect, deleteFloor);

router.post('/tables', protect, createTable);
router.put('/tables/:id', protect, updateTable);
router.delete('/tables', protect, deleteTables);
router.post('/tables/:id/duplicate', protect, duplicateTable);

export default router;
