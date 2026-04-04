const {
  createOrder,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  updateOrderStatus,
  getOrderById,
  listOrders,
  sendToKitchen,
} = require('./orders.service');

const createOrderController = async (req, res, next) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const addOrderItemController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderItem = await addOrderItem(id, req.body);
    res.status(201).json(orderItem);
  } catch (error) {
    next(error);
  }
};

const updateOrderItemController = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { quantity } = req.body;
    const orderItem = await updateOrderItem(id, itemId, quantity);
    res.json(orderItem);
  } catch (error) {
    next(error);
  }
};

const deleteOrderItemController = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const result = await deleteOrderItem(id, itemId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await updateOrderStatus(id, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const listOrdersController = async (req, res, next) => {
  try {
    const orders = await listOrders(req.query);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const sendToKitchenController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await sendToKitchen(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrderController,
  addOrderItemController,
  updateOrderItemController,
  deleteOrderItemController,
  updateOrderStatusController,
  getOrderController,
  listOrdersController,
  sendToKitchenController,
};
