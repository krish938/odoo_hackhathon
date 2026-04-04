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
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const addOrderItemController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orderItem = await addOrderItem(id, req.body);
    res.status(201).json({ success: true, data: orderItem });
  } catch (error) {
    next(error);
  }
};

const updateOrderItemController = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const { quantity } = req.body;
    const orderItem = await updateOrderItem(id, itemId, quantity);
    res.json({ success: true, data: orderItem });
  } catch (error) {
    next(error);
  }
};

const deleteOrderItemController = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    const result = await deleteOrderItem(id, itemId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await updateOrderStatus(id, status);

    // Emit customer display update
    const io = req.app.get('io');
    if (io && status === 'PAID') {
      io.to('customer_display').emit('order_paid', { order_id: id, status });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getOrderController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const listOrdersController = async (req, res, next) => {
  try {
    const orders = await listOrders(req.query);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const sendToKitchenController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await sendToKitchen(id, req.app);
    res.json({ success: true, data: result });
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
