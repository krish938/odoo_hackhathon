const { query, pool } = require('../../config/db');

const openSession = async (terminalId, openingBalance, userId, userName) => {
  const terminalCheck = await query('SELECT id FROM pos_terminals WHERE id = $1', [terminalId]);
  if (terminalCheck.rows.length === 0) {
    throw { status: 400, message: 'Terminal not found' };
  }

  const existingSession = await query(
    'SELECT id FROM sessions WHERE terminal_id = $1 AND status = $2',
    [terminalId, 'OPEN']
  );

  if (existingSession.rows.length > 0) {
    throw { status: 409, message: 'Terminal already has an open session' };
  }

  const result = await query(
    `INSERT INTO sessions (terminal_id, user_id, responsible_label, opening_balance)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [terminalId, userId, userName, openingBalance]
  );

  return result.rows[0];
};

const closeSession = async (sessionId, closingBalance) => {
  const sessionCheck = await query(
    'SELECT * FROM sessions WHERE id = $1 AND status = $2',
    [sessionId, 'OPEN']
  );

  if (sessionCheck.rows.length === 0) {
    throw { status: 404, message: 'Open session not found' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE sessions
       SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP, closing_balance = $1
       WHERE id = $2`,
      [closingBalance, sessionId]
    );
    await client.query(
      'UPDATE self_order_tokens SET is_active = false WHERE session_id = $1',
      [sessionId]
    );
    await client.query('COMMIT');
    return { message: 'Session closed successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * List sessions with proper pagination instead of LIMIT 500.
 * @param {Object} opts - { page, limit, status }
 * @returns {Promise<{ sessions: Array, pagination: Object }>}
 */
const listSessions = async ({ page = 1, limit = 20, status } = {}) => {
  const safeLimit = Math.min(parseInt(limit) || 20, 100);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let where = 'WHERE 1=1';
  const params = [];
  let idx = 1;

  if (status) {
    where += ` AND s.status = $${idx++}`;
    params.push(status);
  }

  const countRes = await query(
    `SELECT COUNT(*) as total FROM sessions s ${where}`,
    params
  );

  const result = await query(
    `SELECT s.id, s.terminal_id, s.user_id, s.responsible_label,
            s.opened_at, s.closed_at, s.status, s.opening_balance, s.closing_balance,
            pt.name AS terminal_name, u.name AS user_name
     FROM sessions s
     JOIN pos_terminals pt ON s.terminal_id = pt.id
     JOIN users u ON s.user_id = u.id
     ${where}
     ORDER BY s.opened_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, safeLimit, offset]
  );

  const total = parseInt(countRes.rows[0].total);
  return {
    sessions: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

const getSessionById = async (sessionId) => {
  const result = await query(
    `SELECT s.*,
            pt.name as terminal_name,
            u.name as user_name,
            COUNT(o.id) as order_count,
            COALESCE(SUM(o.total_amount), 0) as total_sales
     FROM sessions s
     JOIN pos_terminals pt ON s.terminal_id = pt.id
     JOIN users u ON s.user_id = u.id
     LEFT JOIN orders o ON s.id = o.session_id
     WHERE s.id = $1
     GROUP BY s.id, pt.name, u.name`,
    [sessionId]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Session not found' };
  }

  return result.rows[0];
};

module.exports = {
  openSession,
  closeSession,
  listSessions,
  getSessionById,
};
