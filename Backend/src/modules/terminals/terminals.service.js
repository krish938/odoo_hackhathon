const { query } = require('../../config/db');

const createTerminal = async (name) => {
  const result = await query(
    'INSERT INTO pos_terminals (name) VALUES ($1) RETURNING *',
    [name]
  );

  return result.rows[0];
};

const listTerminals = async () => {
  const result = await query(
    `SELECT pt.*, 
            s.id as last_session_id,
            s.opened_at as last_session_opened,
            s.closing_balance as last_closing_balance,
            u.name as last_user_name
     FROM pos_terminals pt
     LEFT JOIN sessions s ON pt.id = s.terminal_id
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.id IS NULL OR s.id = (
         SELECT MAX(id) FROM sessions s2 WHERE s2.terminal_id = pt.id
     )
     ORDER BY pt.name`
  );

  return result.rows;
};

const getTerminalById = async (id) => {
  const result = await query(
    `SELECT pt.*, 
            s.id as last_session_id,
            s.opened_at as last_session_opened,
            s.closing_balance as last_closing_balance,
            u.name as last_user_name
     FROM pos_terminals pt
     LEFT JOIN sessions s ON pt.id = s.terminal_id
     LEFT JOIN users u ON s.user_id = u.id
     WHERE pt.id = $1
     AND (s.id IS NULL OR s.id = (
         SELECT MAX(id) FROM sessions s2 WHERE s2.terminal_id = pt.id
     ))`,
    [id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Terminal not found' };
  }

  return result.rows[0];
};

module.exports = {
  createTerminal,
  listTerminals,
  getTerminalById,
};
