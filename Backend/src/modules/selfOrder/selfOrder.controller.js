const {
  createSelfOrderToken,
  getMenu,
  createSelfOrder,
} = require('./selfOrder.service');

const createTokenController = async (req, res, next) => {
  try {
    const { table_id, session_id } = req.body;
    const token = await createSelfOrderToken(table_id, session_id);
    res.status(201).json(token);
  } catch (error) {
    next(error);
  }
};

const getMenuController = async (req, res, next) => {
  try {
    const { token } = req.query;
    const menu = await getMenu(token);
    res.json(menu);
  } catch (error) {
    next(error);
  }
};

const createSelfOrderController = async (req, res, next) => {
  try {
    const { token } = req.query;
    const order = await createSelfOrder(token, req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTokenController,
  getMenuController,
  createSelfOrderController,
};
