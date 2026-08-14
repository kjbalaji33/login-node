const authService = require('../services/authService');
const { success } = require('../utils/response');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

/**
 * Handles new user registration (Sign Up)
 * Linked to client click submit actions
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      const err = new Error('name, email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const { user, token } = await authService.register({ name, email, password });
    return success(res, 201, 'User registered successfully', { user, token });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles user authentication (Login)
 * Linked to client click submit actions
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error('email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const { user, token } = await authService.login({ email, password });
    return success(res, 200, 'Login successful', { user, token });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves the current logged-in account identity context
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware.protect
    return success(res, 200, 'Current user', { user: req.user });
  } catch (err) {
    next(err);
  }
};

/**
 * Public Endpoint: Updates a user's password using their email context (username)
 * Triggers directly from the "Forgot Password" client click action link
 */
const changePasswordByUsername = async (req, res, next) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      const err = new Error('username (email) and newPassword are required');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error('The new password must be at least 6 characters long');
      err.statusCode = 400;
      throw err;
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Query your users table matching structural pool definitions
    const selectQuery = 'SELECT id, password FROM users WHERE email = $1 LIMIT 1;';
    const dbResult = await pool.query(selectQuery, [normalizedUsername]);

    if (dbResult.rows.length === 0) {
      const err = new Error('Account not found or password update invalid');
      err.statusCode = 404;
      throw err;
    }

    const user = dbResult.rows[0];

    // Enforce check parameter to isolate external Google SSO login identities
    if (user.password === 'OAUTH_EXTERNAL_USER_HASH_PLACEHOLDER') {
      const err = new Error('This account uses Google Sign-In. Password modification is restricted');
      err.statusCode = 400;
      throw err;
    }

    // Generate clean salted bcrypt value pairs
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    const updateQuery = 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2;';
    await pool.query(updateQuery, [newPasswordHash, user.id]);

    logger.info(`Password successfully modified via controller trigger for user ID: ${user.id}`);

    return success(res, 200, 'Password changed successfully. You can now log in.', null);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user logout context and session termination signals
 * Triggers directly from the application profile dashboard click actions
 */
const logoutUser = async (req, res, next) => {
  try {
    // req.user is populated dynamically by your protect middleware guard block
    const userId = req.user?.id;

    logger.info(`User identity successfully logged out of active workspace session: ${userId}`);

    // Returns a uniform structure utilizing your custom global response utility
    return success(res, 200, 'Logout successful', null);
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getMe, 
  changePasswordByUsername, 
  logoutUser 
};
