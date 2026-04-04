const {
  createSelfOrderToken,
  getMenu,
  createSelfOrder,
  invalidateToken,
} = require('./selfOrder.service');

const createTokenController = async (req, res, next) => {
  try {
    const { table_id, session_id } = req.body;
    const token = await createSelfOrderToken(table_id, session_id);
    res.status(201).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

const getMenuController = async (req, res, next) => {
  try {
    const { token } = req.query;
    const menu = await getMenu(token);
    res.json({ success: true, data: menu });
  } catch (error) {
    next(error);
  }
};

const createSelfOrderController = async (req, res, next) => {
  try {
    const { token } = req.query;
    const order = await createSelfOrder(token, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const invalidateTokenController = async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await invalidateToken(token);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTokenController,
  getMenuController,
  createSelfOrderController,
  invalidateTokenController,
};
