const express = require('express');
const router = express.Router();
const { getSessions, openSession, getSession, closeSession, getActiveSessions } = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSessions);
router.post('/open', protect, openSession);
router.get('/active', protect, getActiveSessions);
router.get('/:id', protect, getSession);
router.put('/:id/close', protect, closeSession);

module.exports = router;
