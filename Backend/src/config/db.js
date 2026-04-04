const { Pool } = require('pg');
const { env } = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected DB pool error');
});

pool.on('connect', () => {
  logger.debug('DB pool: new client connected');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
