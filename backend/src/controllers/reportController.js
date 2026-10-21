const db = require('../config/db');
const { Parser } = require('json2csv');

/**
 * Task 4.1: Daily Exception Report Engine
 * Identifies timekeeping anomalies: missing clock-outs, unrostered attempts, and break violations.
 */
const getDailyExceptions = async (req, res) => {
  const { date } = req.query; // Format: YYYY-MM-DD (Defaults to today)
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch Missing Clock Outs (Clocked in on target date but no subsequent clock out)
    const [missingClockOuts] = await db.execute(
      `SELECT 
         u.user_id, u.employee_code, u.first_name, u.last_name, d.dept_name,
         c.event_id AS last_event_id, c.event_timestamp AS clock_in_time
       FROM clock_events c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       WHERE DATE(c.event_timestamp) = ? 
         AND c.event_type = 'CLOCK_IN'
         AND NOT EXISTS (
           SELECT 1 FROM clock_events co
           WHERE co.user_id = c.user_id
             AND co.event_type = 'CLOCK_OUT'
             AND co.event_timestamp > c.event_timestamp
         )
       ORDER BY c.event_timestamp ASC`,
      [targetDate]
    );

    // 2. Fetch Unrostered Clock In Attempts (Clocked in on a date where no shift was assigned)
    const [unrosteredClockIns] = await db.execute(
      `SELECT 
         u.user_id, u.employee_code, u.first_name, u.last_name, d.dept_name,
         c.event_id, c.event_timestamp AS clock_in_time
       FROM clock_events c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       WHERE DATE(c.event_timestamp) = ? 
         AND c.event_type = 'CLOCK_IN'
         AND NOT EXISTS (
           SELECT 1 FROM roster_shifts r
           WHERE r.user_id = c.user_id
             AND r.shift_date = ?
         )
       ORDER BY c.event_timestamp ASC`,
      [targetDate, targetDate]
    );

    // 3. Fetch Meal Break Violations (> 5 continuous hours worked without a recorded meal break)
    const [clockIns] = await db.execute(
      `SELECT 
         u.user_id, u.employee_code, u.first_name, u.last_name, d.dept_name,
         c.event_timestamp AS clock_in_time
       FROM clock_events c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       WHERE DATE(c.event_timestamp) = ? AND c.event_type = 'CLOCK_IN'
       ORDER BY c.event_timestamp ASC`,
      [targetDate]
    );

    const breakViolations = [];

    for (const cin of clockIns) {
      const [outs] = await db.execute(
        `SELECT event_timestamp FROM clock_events
         WHERE user_id = ? AND event_type = 'CLOCK_OUT' AND event_timestamp > ?
         ORDER BY event_timestamp ASC LIMIT 1`,
        [cin.user_id, cin.clock_in_time]
      );

      const endTime = outs.length > 0 ? new Date(outs[0].event_timestamp) : new Date();
      const startTime = new Date(cin.clock_in_time);
      const elapsedHours = (endTime - startTime) / (1000 * 60 * 60);

      if (elapsedHours >= 5.0) {
        const [breaks] = await db.execute(
          `SELECT event_id FROM clock_events
           WHERE user_id = ? 
             AND event_type = 'BREAK_START' 
             AND event_timestamp BETWEEN ? AND ?`,
          [cin.user_id, cin.clock_in_time, endTime]
        );

        if (breaks.length === 0) {
          breakViolations.push({
            userId: cin.user_id,
            employeeCode: cin.employee_code,
            firstName: cin.first_name,
            lastName: cin.last_name,
            deptName: cin.dept_name || 'General Operations',
            clockInTime: cin.clock_in_time,
            elapsedHours: parseFloat(elapsedHours.toFixed(2)),
            violationType: 'EXCEEDED_5_HOURS_NO_MEAL_BREAK'
          });
        }
      }
    }

    res.json({
      reportDate: targetDate,
      summary: {
        totalMissingClockOuts: missingClockOuts.length,
        totalUnrosteredClockIns: unrosteredClockIns.length,
        totalBreakViolations: breakViolations.length,
        totalExceptions: missingClockOuts.length + unrosteredClockIns.length + breakViolations.length
      },
      exceptions: {
        missingClockOuts,
        unrosteredClockIns,
        breakViolations
      }
    });

  } catch (error) {
    console.error('Error generating exception report:', error);
    res.status(500).json({ error: 'Failed to generate daily exception report.' });
  }
};

/**
 * Task 4.3: Export Payroll Data to CSV Module
 * Queries timecard records for a given date range and generates downloadable CSV file.
 */
const exportPayrollCSV = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate query parameters are required.' });
  }

  try {
    const query = `
      SELECT 
        u.employee_code AS 'Employee Code',
        CONCAT(u.first_name, ' ', u.last_name) AS 'Employee Name',
        d.dept_name AS 'Department',
        DATE(ce.event_timestamp) AS 'Work Date',
        MIN(CASE WHEN ce.event_type = 'CLOCK_IN' THEN TIME(ce.event_timestamp) END) AS 'Clock In',
        MAX(CASE WHEN ce.event_type = 'CLOCK_OUT' THEN TIME(ce.event_timestamp) END) AS 'Clock Out',
        ROUND(
          TIMESTAMPDIFF(MINUTE, 
            MIN(CASE WHEN ce.event_type = 'CLOCK_IN' THEN ce.event_timestamp END), 
            MAX(CASE WHEN ce.event_type = 'CLOCK_OUT' THEN ce.event_timestamp END)
          ) / 60.0, 2
        ) AS 'Total Hours Worked'
      FROM users u
      LEFT JOIN departments d ON u.dept_id = d.dept_id
      JOIN clock_events ce ON u.user_id = ce.user_id
      WHERE DATE(ce.event_timestamp) BETWEEN ? AND ?
      GROUP BY u.user_id, DATE(ce.event_timestamp)
      ORDER BY DATE(ce.event_timestamp) ASC, u.employee_code ASC;
    `;

    const [rows] = await db.execute(query, [startDate, endDate]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No work records found for the specified date range.' });
    }

    const fields = ['Employee Code', 'Employee Name', 'Department', 'Work Date', 'Clock In', 'Clock Out', 'Total Hours Worked'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`beerenberg_payroll_${startDate}_to_${endDate}.csv`);
    return res.status(200).send(csv);

  } catch (err) {
    console.error('Error generating payroll CSV export:', err);
    return res.status(500).json({ error: 'Failed to generate payroll CSV file.' });
  }
};

module.exports = {
  getDailyExceptions,
  exportPayrollCSV
};