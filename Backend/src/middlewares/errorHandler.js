const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';

  logger.error({ requestId, err, path: req.path, method: req.method }, 'Request failed');

  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: err.message,
      message: err.message,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Validation failed',
      details: err.errors || err.message,
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      message: 'Resource already exists',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference',
      message: 'Invalid reference — related resource does not exist',
    });
  }

  if (err.code === '23502') {
    return res.status(400).json({
      success: false,
      error: 'Required field missing',
      message: 'A required field is missing',
    });
  }

  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Constraint violation',
      message: 'Value violates a database constraint (e.g. negative price)',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Internal server error',
    requestId,
  });
};

module.exports = errorHandler;
