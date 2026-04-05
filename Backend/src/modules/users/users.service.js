const { query } = require('../../config/db');

const listUsersForReports = async (filters = {}) => {
  const { page = 1, limit = 50, search, role } = filters;
  const safeLimit = Math.min(parseInt(limit) || 50, 200);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let whereClause = 'WHERE is_deleted = false';
  const params = [];
  let idx = 1;

  if (search) {
    whereClause += ` AND (name ILIKE $${idx} OR email ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  if (role) {
    whereClause += ` AND role = $${idx}`;
    params.push(role);
    idx++;
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM users ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total);

  const result = await query(
    `SELECT id, name, email, role, created_at
     FROM users
     ${whereClause}
     ORDER BY id ASC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, safeLimit, offset]
  );

  return {
    users: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

module.exports = { listUsersForReports };
