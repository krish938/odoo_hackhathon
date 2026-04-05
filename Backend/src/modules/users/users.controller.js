const { listUsersForReports } = require('./users.service');

const listUsersController = async (req, res, next) => {
  try {
    const users = await listUsersForReports(req.query);
    res.json({ success: true, ...users });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsersController };
