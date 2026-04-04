const validate = (schema) => {
  return (req, res, next) => {
    try {
      const data = {
        body: req.body,
        params: req.params,
        query: req.query,
      };

      const result = schema.parse(data);
      req.body = result.body;
      req.params = result.params;
      req.query = result.query;

      next();
    } catch (error) {
      if (error?.name === 'ZodError' && Array.isArray(error.issues)) {
        const details = error.issues.map((issue) => {
          const path = issue.path.filter((p) => p !== 'body');
          return {
            field: path.join('.') || 'body',
            message: issue.message,
          };
        });
        const primary = details[0]?.message || 'Validation failed';
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: primary,
          details,
        });
      }
      return next(error);
    }
  };
};

module.exports = validate;
