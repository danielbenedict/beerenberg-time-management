const db = require('../config/db');

// Fetch Active Kiosk Stations
const getKiosks = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT kiosk_id, kiosk_name, location_name FROM kiosks WHERE is_active = 1`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching kiosks:', error);
    res.status(500).json({ error: 'Failed to fetch kiosk locations' });
  }
};

// Verify Staff PIN or Temporary 72-Hour PIN (Updated for Task 3.3 Soft Compliance Prompts)
const verifyPin = async (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  const cleanPin = pin.toString().trim();

  try {
    let userObj = null;
    let isTemp = false;
    let tempExpiresAt = null;

    // 1. Check permanent user PIN
    const [rows] = await db.execute(
      `SELECT u.user_id, u.employee_code, u.first_name, u.last_name, u.is_active,
              d.dept_name, r.role_name
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE (u.pin = ? OR u.pin_code = ?) AND u.is_active = 1`,
      [cleanPin, cleanPin]
    );

    if (rows.length > 0) {
      userObj = rows[0];
    } else {
      // 2. Check active 72-hour temporary PIN
      const [tempRows] = await db.execute(
        `SELECT tp.temp_pin_id, tp.expires_at, u.user_id, u.employee_code, u.first_name, u.last_name,
                d.dept_name, r.role_name
         FROM temp_pins tp
         JOIN users u ON tp.user_id = u.user_id
         LEFT JOIN departments d ON u.dept_id = d.dept_id
         LEFT JOIN roles r ON u.role_id = r.role_id
         WHERE tp.pin = ? AND tp.expires_at > NOW() AND u.is_active = 1`,
        [cleanPin]
      );

      if (tempRows.length > 0) {
        userObj = tempRows[0];
        isTemp = true;
        tempExpiresAt = userObj.expires_at;
      }
    }

    if (!userObj) {
      return res.status(401).json({ error: 'Invalid or Expired PIN' });
    }

    // --- TASK 3.3 ENHANCEMENT: Fetch latest clock-in and meal break status ---
    const [lastClockInRows] = await db.execute(
      `SELECT event_timestamp FROM clock_events 
       WHERE user_id = ? AND event_type = 'CLOCK_IN' 
       ORDER BY event_timestamp DESC LIMIT 1`,
      [userObj.user_id]
    );

    let lastClockIn = lastClockInRows.length > 0 ? lastClockInRows[0].event_timestamp : null;
    let hasTakenMealBreak = false;

    if (lastClockIn) {
      // Check if a meal break occurred after the most recent clock-in
      const [mealBreakRows] = await db.execute(
        `SELECT event_id FROM clock_events 
         WHERE user_id = ? AND event_type = 'BREAK_START' 
           AND (break_reason LIKE '%Meal%' OR break_reason LIKE '%Lunch%') 
           AND event_timestamp >= ? 
         LIMIT 1`,
        [userObj.user_id, lastClockIn]
      );
      hasTakenMealBreak = mealBreakRows.length > 0;
    }

    return res.json({
      message: isTemp ? 'Temporary 72-hour PIN verified successfully' : 'PIN verified successfully',
      isTemporaryPin: isTemp,
      expiresAt: tempExpiresAt,
      user: {
        userId: userObj.user_id,
        employeeCode: userObj.employee_code,
        firstName: userObj.first_name,
        lastName: userObj.last_name,
        deptName: userObj.dept_name || (isTemp ? 'Temporary Staff' : 'General Operations'),
        roleName: userObj.role_name,
        lastClockIn,
        hasTakenMealBreak
      }
    });

  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({ error: 'Internal server error verifying PIN' });
  }
};

// Generate Temporary 72-Hour PIN for Contractor / Temp Staff
const generateTempPin = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Generate random 4-digit PIN
  const tempPin = Math.floor(1000 + Math.random() * 9000).toString();

  // Set expiry to 72 hours from current time
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  try {
    const [result] = await db.execute(
      `INSERT INTO temp_pins (user_id, pin, expires_at) VALUES (?, ?, ?)`,
      [userId, tempPin, expiresAt]
    );

    res.status(201).json({
      message: 'Temporary 72-Hour PIN generated successfully',
      tempPinId: result.insertId,
      tempPin,
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error generating temporary PIN:', error);
    res.status(500).json({ error: 'Failed to generate temporary PIN' });
  }
};

// Record Clocking Events linking kiosk_id and Optional Break Reason
const recordClockEvent = async (req, res) => {
  const { userId, kioskId, eventType, verificationMethod, breakReason } = req.body;

  if (!userId || !eventType) {
    return res.status(400).json({ error: 'User ID and Event Type are required' });
  }

  const validEvents = ['CLOCK_IN', 'BREAK_START', 'BREAK_END', 'CLOCK_OUT'];
  if (!validEvents.includes(eventType)) {
    return res.status(400).json({ error: 'Invalid event type' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO clock_events (user_id, kiosk_id, event_type, verification_method, break_reason, is_manual_entry)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [userId, kioskId || 1, eventType, verificationMethod || 'PIN', breakReason || null]
    );

    res.status(201).json({
      message: `Successfully recorded ${eventType.replace('_', ' ')}`,
      eventId: result.insertId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording clock event:', error);
    res.status(500).json({ error: 'Failed to record clocking event' });
  }
};

// Task 3.1 & 3.2: Daily/Weekly Hours + Paid/Unpaid Break Calculations
const getUserWorkHours = async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Fetch user contract info for weekly threshold
    const [contractRows] = await db.execute(
      `SELECT weekly_max_hours FROM contracts WHERE user_id = ? AND (end_date IS NULL OR end_date >= CURDATE()) LIMIT 1`,
      [userId]
    );
    const weeklyThreshold = contractRows.length > 0 ? parseFloat(contractRows[0].weekly_max_hours) : 38.0;

    // 2. Fetch all clock events for the user ordered by timestamp
    const [events] = await db.execute(
      `SELECT event_type, event_timestamp, break_reason 
       FROM clock_events 
       WHERE user_id = ? 
       ORDER BY event_timestamp ASC`,
      [userId]
    );

    const dailyTotals = {};
    let lastClockIn = null;
    let lastBreakStart = null;

    events.forEach(evt => {
      const timestamp = new Date(evt.event_timestamp);
      const dateKey = timestamp.toISOString().split('T')[0];

      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = { grossHours: 0, unpaidBreakHours: 0, paidBreakHours: 0 };
      }

      if (evt.event_type === 'CLOCK_IN') {
        lastClockIn = timestamp;
      } else if (evt.event_type === 'BREAK_START') {
        lastBreakStart = timestamp;
      } else if (evt.event_type === 'BREAK_END' && lastBreakStart) {
        const breakMins = (timestamp - lastBreakStart) / (1000 * 60);
        
        // Award Policy: Breaks > 20 mins are unpaid meal breaks
        if (breakMins > 20) {
          dailyTotals[dateKey].unpaidBreakHours += (breakMins / 60);
        } else {
          dailyTotals[dateKey].paidBreakHours += (breakMins / 60);
        }
        lastBreakStart = null;
      } else if (evt.event_type === 'CLOCK_OUT' && lastClockIn) {
        const elapsedHours = (timestamp - lastClockIn) / (1000 * 60 * 60);
        dailyTotals[dateKey].grossHours += elapsedHours;
        lastClockIn = null;
      }
    });

    let totalWeeklyHours = 0;
    let totalStandardHours = 0;
    let totalOvertimeHours = 0;

    const dailyBreakdown = Object.keys(dailyTotals).map(date => {
      const dayData = dailyTotals[date];
      // Net worked hours = Gross elapsed time - Unpaid meal breaks
      const netWorkedHours = Math.max(0, dayData.grossHours - dayData.unpaidBreakHours);
      const standardHours = Math.min(netWorkedHours, 8.0);
      const dailyOvertime = Math.max(0, netWorkedHours - 8.0);

      totalWeeklyHours += netWorkedHours;
      totalStandardHours += standardHours;
      totalOvertimeHours += dailyOvertime;

      return {
        date,
        grossHours: parseFloat(dayData.grossHours.toFixed(2)),
        unpaidBreakHours: parseFloat(dayData.unpaidBreakHours.toFixed(2)),
        paidBreakHours: parseFloat(dayData.paidBreakHours.toFixed(2)),
        netWorkedHours: parseFloat(netWorkedHours.toFixed(2)),
        standardHours: parseFloat(standardHours.toFixed(2)),
        dailyOvertimeHours: parseFloat(dailyOvertime.toFixed(2)),
        isDailyOvertimeFlagged: dailyOvertime > 0
      };
    });

    const isWeeklyOvertimeExceeded = totalWeeklyHours > weeklyThreshold;

    res.json({
      userId: parseInt(userId),
      weeklyThreshold,
      summary: {
        totalWeeklyNetHours: parseFloat(totalWeeklyHours.toFixed(2)),
        totalStandardHours: parseFloat(totalStandardHours.toFixed(2)),
        totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
        isWeeklyOvertimeExceeded
      },
      dailyBreakdown
    });

  } catch (error) {
    console.error('Error calculating work hours:', error);
    res.status(500).json({ error: 'Failed to calculate work hours and break rules.' });
  }
};

// Task 3.4: Admin & Supervisor Clock Override Module (PIN + Mandatory Reason)
const manualClockOverride = async (req, res) => {
  const { supervisorPin, userId, kioskId, eventType, eventTimestamp, breakReason, overrideReason } = req.body;

  if (!supervisorPin || !userId || !eventType || !overrideReason) {
    return res.status(400).json({ error: 'Supervisor PIN, target User ID, Event Type, and Audit Reason are required.' });
  }

  const cleanPin = supervisorPin.toString().trim();

  try {
    // 1. Verify Supervisor PIN & Role Authorization
    const [supervisorRows] = await db.execute(
      `SELECT u.user_id, r.role_name 
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       WHERE (u.pin = ? OR u.pin_code = ?) AND u.is_active = 1`,
      [cleanPin, cleanPin]
    );

    if (supervisorRows.length === 0) {
      return res.status(401).json({ error: 'Invalid Supervisor PIN.' });
    }

    const supervisorRole = supervisorRows[0].role_name ? supervisorRows[0].role_name.toLowerCase() : '';
    if (!supervisorRole.includes('admin') && !supervisorRole.includes('supervisor') && !supervisorRole.includes('manager')) {
      return res.status(403).json({ error: 'Access denied: PIN does not belong to an Admin or Supervisor.' });
    }

    // 2. Insert Manual Event into clock_events with Audit Details
    const customTimestamp = eventTimestamp ? new Date(eventTimestamp) : new Date();
    const fullBreakReason = breakReason 
      ? `${breakReason} [Manual Override: ${overrideReason}]` 
      : `[Manual Override: ${overrideReason}]`;

    const [result] = await db.execute(
      `INSERT INTO clock_events (user_id, kiosk_id, event_type, verification_method, break_reason, event_timestamp, is_manual_entry)
       VALUES (?, ?, ?, 'SUPERVISOR_OVERRIDE', ?, ?, TRUE)`,
      [userId, kioskId || 1, eventType, fullBreakReason, customTimestamp]
    );

    res.status(201).json({
      message: 'Manual clock override recorded successfully.',
      eventId: result.insertId,
      supervisorId: supervisorRows[0].user_id,
      timestamp: customTimestamp.toISOString()
    });

  } catch (error) {
    console.error('Error recording manual clock override:', error);
    res.status(500).json({ error: 'Failed to record clock override.' });
  }
};

// Task 3.5: Fetch Audit Log of Manual Clock Overrides
const getAuditLogs = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.event_id, e.user_id, u.first_name, u.last_name, u.employee_code,
              e.event_type, e.verification_method, e.break_reason, e.event_timestamp
       FROM clock_events e
       JOIN users u ON e.user_id = u.user_id
       WHERE e.is_manual_entry = TRUE OR e.verification_method = 'SUPERVISOR_OVERRIDE'
       ORDER BY e.event_timestamp DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

module.exports = {
  getKiosks,
  verifyPin,
  generateTempPin,
  recordClockEvent,
  getUserWorkHours,
  manualClockOverride,
  getAuditLogs
};