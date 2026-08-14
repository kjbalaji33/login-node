const { Pool } = require('pg');
const logger = require('../utils/logger');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Supabase's pooler (port 5432/6543) requires SSL. rejectUnauthorized:false
// avoids local CA issues; for production you can pin Supabase's CA cert instead.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  logger.info('New client connected to PostgreSQL pool');
});

pool.on('error', (err) => {
  logger.error(`Unexpected PostgreSQL pool error: ${err.message}`);
});

/**
 * Run a query using the pool. Prefer this for simple, single queries.
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a dedicated client for transactions.
 * Always release the client when done: `client.release()`.
 */
const getClient = () => pool.connect();

/**
 * Quick connectivity check used at server startup.
 */
const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    logger.info('PostgreSQL connection verified');
  } finally {
    client.release();
  }
};

module.exports = { pool, query, getClient, testConnection };
