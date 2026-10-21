const express = require('express');
const router = express.Router();
const { getDailyExceptions, exportPayrollCSV } = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Endpoint: GET /api/v1/reports/exceptions?date=YYYY-MM-DD
router.get(
  '/exceptions',
  authenticateToken,
  requireRole('Office Admin', 'Roster Admin', 'Supervisor'),
  getDailyExceptions
);

// Task 4.3 Endpoint: GET /api/v1/reports/export/csv?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
  '/export/csv',
  authenticateToken,
  requireRole('Office Admin', 'Roster Admin'),
  exportPayrollCSV
);

module.exports = router;