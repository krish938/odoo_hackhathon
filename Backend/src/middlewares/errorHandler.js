const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

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
      message: 'Invalid reference',
    });
  }

  if (err.code === '23502') {
    return res.status(400).json({
      success: false,
      error: 'Required field missing',
      message: 'Required field missing',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Internal server error',
  });
};

module.exports = errorHandler;
