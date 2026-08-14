const { query } = require('../config/database');

/**
 * Expects a `users` table, e.g.:
 *
 * CREATE TABLE users (
 *   id SERIAL PRIMARY KEY,
 *   name VARCHAR(255) NOT NULL,
 *   email VARCHAR(255) UNIQUE NOT NULL,
 *   password VARCHAR(255) NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

const findByEmail = async (email) => {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await query(
    'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const findAll = async ({ limit = 50, offset = 0 } = {}) => {
  const { rows } = await query(
    'SELECT id, name, email, created_at, updated_at FROM users ORDER BY id DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return rows;
};

const create = async ({ name, email, password }) => {
  const { rows } = await query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at, updated_at`,
    [name, email, password]
  );
  return rows[0];
};

const updateById = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return findById(id);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = keys.map((key) => fields[key]);

  const { rows } = await query(
    `UPDATE users SET ${setClause}, updated_at = NOW()
     WHERE id = $${keys.length + 1}
     RETURNING id, name, email, created_at, updated_at`,
    [...values, id]
  );
  return rows[0] || null;
};

const deleteById = async (id) => {
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { findByEmail, findById, findAll, create, updateById, deleteById };
