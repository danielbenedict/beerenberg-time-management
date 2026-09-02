const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT u.user_id, u.employee_code, u.first_name, u.last_name, u.email, u.password_hash, u.is_active, r.role_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.email = ? OR u.employee_code = ?`,
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'User does not have administrative web access.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        userId: user.user_id, 
        role: user.role_name,
        employeeCode: user.employee_code 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        employeeCode: user.employee_code,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

module.exports = { login };