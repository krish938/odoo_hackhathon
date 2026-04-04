const {
  openSession,
  closeSession,
  listSessions,
  getSessionById,
} = require('./sessions.service');

const openSessionController = async (req, res, next) => {
  try {
    const { terminal_id, opening_balance } = req.body;
    const { id: userId, name: userName } = req.user;
    const session = await openSession(terminal_id, opening_balance, userId, userName);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

const closeSessionController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const closing_balance = req.body?.closing_balance ?? 0;
    const result = await closeSession(id, closing_balance);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const listSessionsController = async (req, res, next) => {
  try {
    const sessions = await listSessions();
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

const getSessionController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await getSessionById(id);
    res.json(session);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  openSessionController,
  closeSessionController,
  listSessionsController,
  getSessionController,
};
