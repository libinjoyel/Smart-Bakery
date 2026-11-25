const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../middleware/auth');

const login = (req, res) => {
  const { username, password } = req.body || {};

  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password.',
    });
  }

  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '13579';
  const staffUsername = (process.env.STAFF_USERNAME || 'staff').trim().toLowerCase();
  const staffPassword = process.env.STAFF_PASSWORD || '12345';

  const normalizedInputUser = username.trim().toLowerCase();
  const inputPassword = password; // Passwords must be matched exactly (case-sensitive)

  let authenticatedUser = null;

  if (normalizedInputUser === adminUsername && inputPassword === adminPassword) {
    authenticatedUser = {
      username: 'admin',
      role: 'ADMIN',
    };
  } else if (normalizedInputUser === staffUsername && inputPassword === staffPassword) {
    authenticatedUser = {
      username: 'staff',
      role: 'STAFF',
    };
  }

  if (!authenticatedUser) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password.',
    });
  }

  const token = jwt.sign(
    {
      username: authenticatedUser.username,
      role: authenticatedUser.role,
    },
    getJwtSecret(),
    { expiresIn: '24h' }
  );

  return res.json({
    success: true,
    token,
    user: authenticatedUser,
  });
};

const getMe = (req, res) => {
  return res.json({
    success: true,
    user: {
      username: req.user.username,
      role: req.user.role,
    },
  });
};

module.exports = {
  login,
  getMe,
};
