const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Get All Staff Members (with Department, Role, and Active Contract)
const getUsers = async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.user_id, u.employee_code, u.first_name, u.last_name, u.email, u.is_active, u.created_at,
              r.role_name, d.dept_name,
              c.contract_type, c.hourly_rate, c.weekly_max_hours
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       LEFT JOIN contracts c ON u.user_id = c.user_id AND (c.end_date IS NULL OR c.end_date >= CURDATE())
       ORDER BY u.created_at DESC`
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to retrieve staff members.' });
  }
};

// 2. Create New Staff Member (+ Contract Record)
const createUser = async (req, res) => {
  const { 
    employee_code, first_name, last_name, email, pin, password, 
    dept_id, role_id, 
    contract_type = 'Full-Time', hourly_rate = 25.00, weekly_max_hours = 38.00 
  } = req.body;

  if (!employee_code || !first_name || !last_name || !pin) {
    return res.status(400).json({ 
      error: 'Missing required fields: employee_code, first_name, last_name, and pin are required.' 
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Plaintext PIN string for Kiosk query matching
    const rawPin = pin.toString().trim();
    const pin_code = await bcrypt.hash(rawPin, 10);
    const password_hash = password ? await bcrypt.hash(password, 10) : null;

    // Insert User Record saving both `pin` and `pin_code`
    const [userResult] = await connection.execute(
      `INSERT INTO users (employee_code, first_name, last_name, email, pin, pin_code, password_hash, dept_id, role_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [employee_code, first_name, last_name, email || null, rawPin, pin_code, password_hash, dept_id || null, role_id || null]
    );

    const userId = userResult.insertId;

    // Insert Associated Contract Record
    await connection.execute(
      `INSERT INTO contracts (user_id, contract_type, weekly_max_hours, hourly_rate, start_date)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [userId, contract_type, weekly_max_hours, hourly_rate]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Staff member and contract created successfully',
      userId,
      employee_code
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Employee code or email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create staff member.' });
  } finally {
    connection.release();
  }
};

// 3. Update Staff Member Record
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, pin, dept_id, role_id, is_active } = req.body;

  try {
    const rawPin = pin ? pin.toString().trim() : null;
    const pin_code = rawPin ? await bcrypt.hash(rawPin, 10) : null;

    const [result] = await db.execute(
      `UPDATE users 
       SET first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           email = COALESCE(?, email),
           pin = COALESCE(?, pin),
           pin_code = COALESCE(?, pin_code),
           dept_id = COALESCE(?, dept_id),
           role_id = COALESCE(?, role_id),
           is_active = COALESCE(?, is_active)
       WHERE user_id = ?`,
      [
        first_name || null, 
        last_name || null, 
        email || null, 
        rawPin, 
        pin_code, 
        dept_id || null, 
        role_id || null, 
        is_active !== undefined ? is_active : null, 
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    res.json({ message: 'Staff member record updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update staff member.' });
  }
};

// 4. Get Departments & Roles Metadata
const getDepartmentsAndRoles = async (req, res) => {
  try {
    const [departments] = await db.execute('SELECT * FROM departments ORDER BY dept_name ASC');
    const [roles] = await db.execute('SELECT * FROM roles ORDER BY role_name ASC');
    res.json({ departments, roles });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to retrieve departments and roles.' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  getDepartmentsAndRoles
};