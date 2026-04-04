const { listUsersForReports } = require('./users.service');

const listUsersController = async (req, res, next) => {
  try {
    const users = await listUsersForReports();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsersController };
