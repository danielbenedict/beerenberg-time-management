const express = require('express');
const router = express.Router();
const { 
  getKiosks, 
  verifyPin, 
  generateTempPin, 
  recordClockEvent,
  getUserWorkHours,
  manualClockOverride,
  getAuditLogs 
} = require('../controllers/kioskController');

router.get('/kiosks', getKiosks);
router.post('/kiosk/verify-pin', verifyPin);
router.post('/kiosk/temp-pin', generateTempPin);
router.post('/kiosk/clock', recordClockEvent);

// Task 3.1: Overtime & Rules Engine Route
router.get('/kiosk/hours/:userId', getUserWorkHours);

// Task 3.4: Admin & Supervisor Clock Override Route
router.post('/kiosk/override', manualClockOverride);

// Task 3.5: Audit Trail Database Logging Route
router.get('/kiosk/audit-logs', getAuditLogs);

module.exports = router;