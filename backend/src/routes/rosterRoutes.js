const express = require('express');
const router = express.Router();
const { getRosterShifts, createRosterShift } = require('../controllers/rosterController');

// Task 1.4: Shift Rostering Endpoints
router.get('/roster', getRosterShifts);
router.post('/roster', createRosterShift);

module.exports = router;