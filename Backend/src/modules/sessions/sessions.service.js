const { query } = require('../../config/db');

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

  await query('BEGIN');

  try {
    await query(
      `UPDATE sessions 
       SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP, closing_balance = $1
       WHERE id = $2`,
      [closingBalance, sessionId]
    );

    await query(
      'UPDATE self_order_tokens SET is_active = false WHERE session_id = $1',
      [sessionId]
    );

    await query('COMMIT');

    return { message: 'Session closed successfully' };
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

const listSessions = async (limit = 500) => {
  const result = await query(
    `SELECT s.id,
            s.terminal_id,
            s.user_id,
            s.responsible_label,
            s.opened_at,
            s.closed_at,
            s.status,
            s.opening_balance,
            s.closing_balance,
            pt.name AS terminal_name,
            u.name AS user_name
     FROM sessions s
     JOIN pos_terminals pt ON s.terminal_id = pt.id
     JOIN users u ON s.user_id = u.id
     ORDER BY s.opened_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
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
