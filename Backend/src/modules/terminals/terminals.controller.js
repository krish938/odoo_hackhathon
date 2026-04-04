const {
  createTerminal,
  listTerminals,
  getTerminalById,
} = require('./terminals.service');

const createTerminalController = async (req, res, next) => {
  try {
    const { name } = req.body;
    const terminal = await createTerminal(name);
    res.status(201).json({ success: true, data: terminal });
  } catch (error) {
    next(error);
  }
};

const listTerminalsController = async (req, res, next) => {
  try {
    const terminals = await listTerminals();
    res.json({ success: true, data: terminals });
  } catch (error) {
    next(error);
  }
};

const getTerminalController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const terminal = await getTerminalById(id);
    res.json({ success: true, data: terminal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTerminalController,
  listTerminalsController,
  getTerminalController,
};
