const db = require('../config/db');

// 1. Get all scheduled shifts (with user details)
const getRosterShifts = async (req, res) => {
  try {
    const [shifts] = await db.execute(
      `SELECT s.shift_id, s.user_id, s.shift_date, s.start_time, s.end_time, s.break_duration_mins, s.created_at,
              u.employee_code, u.first_name, u.last_name,
              d.dept_name
       FROM roster_shifts s
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       ORDER BY s.shift_date ASC, s.start_time ASC`
    );
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching roster shifts:', error);
    res.status(500).json({ error: 'Failed to retrieve roster shifts.' });
  }
};

// 2. Create a new shift assignment
const createRosterShift = async (req, res) => {
  const { user_id, shift_date, start_time, end_time, break_duration_mins = 30 } = req.body;

  if (!user_id || !shift_date || !start_time || !end_time) {
    return res.status(400).json({
      error: 'Missing required fields: user_id, shift_date, start_time, and end_time are required.'
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO roster_shifts (user_id, shift_date, start_time, end_time, break_duration_mins)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, shift_date, start_time, end_time, break_duration_mins]
    );

    res.status(201).json({
      message: 'Shift assigned successfully',
      shiftId: result.insertId
    });
  } catch (error) {
    console.error('Error creating roster shift:', error);
    res.status(500).json({ error: 'Failed to create roster shift.' });
  }
};

module.exports = {
  getRosterShifts,
  createRosterShift
};