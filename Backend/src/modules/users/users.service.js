const { query } = require('../../config/db');

const listUsersForReports = async () => {
  const result = await query(
    `SELECT id, name, email, role
     FROM users
     WHERE is_deleted = false
     ORDER BY name`
  );
  return result.rows;
};

module.exports = { listUsersForReports };
