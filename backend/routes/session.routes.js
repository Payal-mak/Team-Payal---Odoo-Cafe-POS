import express from 'express';
import {
    openSession,
    closeSession,
    getCurrentSession,
    getSessionHistory,
    getSessionById,
    getPosConfigs
} from '../controllers/session.controller.js';

const router = express.Router();

// POS Configs
router.get('/pos-configs', getPosConfigs);

// Sessions
router.get('/sessions/current', getCurrentSession);
router.get('/sessions/history', getSessionHistory);
router.get('/sessions/:id', getSessionById);
router.post('/sessions/open', openSession);
router.post('/sessions/:id/close', closeSession);

export default router;
