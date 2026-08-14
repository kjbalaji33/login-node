const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

/**
 * Sign a new authentication token using standard project configuration profiles
 */
const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Encrypt passwords and persist unique new client entries
 */
const register = async ({ name, email, password }) => {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409; // Conflict status
    throw err;
  }

  // 1. Generate salt and compute cryptographic hash value
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.create({ name, email, password: hashedPassword });

  // 2. Fix: Strip the sensitive password hash out before issuing response payload data
  const { password: _pw, ...safeUser } = user;

  // 3. Complete system handshake and assign active session token
  const token = generateToken({ id: user.id, email: user.email });
  return { user: safeUser, token };
};

/**
 * Parse plain-text keys against stored database hashes to identify existing sessions
 */
const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401; // Unauthorized
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken({ id: user.id, email: user.email });
  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token };
};

module.exports = { register, login, generateToken };
