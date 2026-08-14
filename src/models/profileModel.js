const { query } = require('../config/database');

/**
 * Expects a `profiles` table, e.g.:
 *
 * CREATE TABLE profiles (
 *   id SERIAL PRIMARY KEY,
 *   user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   bio TEXT,
 *   avatar_url TEXT,
 *   phone VARCHAR(20),
 *   address TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

const findByUserId = async (userId) => {
  const { rows } = await query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return rows[0] || null;
};

const create = async ({ userId, bio = null, avatarUrl = null, phone = null, address = null }) => {
  const { rows } = await query(
    `INSERT INTO profiles (user_id, bio, avatar_url, phone, address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, bio, avatarUrl, phone, address]
  );
  return rows[0];
};

const updateByUserId = async (userId, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findByUserId(userId);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = keys.map((key) => fields[key]);

  const { rows } = await query(
    `UPDATE profiles SET ${setClause}, updated_at = NOW()
     WHERE user_id = $${keys.length + 1}
     RETURNING *`,
    [...values, userId]
  );
  return rows[0] || null;
};

const deleteByUserId = async (userId) => {
  const { rowCount } = await query('DELETE FROM profiles WHERE user_id = $1', [userId]);
  return rowCount > 0;
};

module.exports = { findByUserId, create, updateByUserId, deleteByUserId };
