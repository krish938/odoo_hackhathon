const { listUsersForReports } = require('./users.service');

const listUsersController = async (req, res, next) => {
  try {
    const users = await listUsersForReports();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsersController };
