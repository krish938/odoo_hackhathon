const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { query } = require('../config/db');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Access token required',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const result = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND is_deleted = false',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid token',
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Invalid token',
    });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Authentication required',
      });
    }

    const roleHierarchy = { admin: 3, staff: 1 };
    const userRoleLevel = roleHierarchy[req.user.role];
    const requiredLevel = Math.max(...allowedRoles.map(role => roleHierarchy[role]));

    if (userRoleLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = { verifyToken, requireRole };
