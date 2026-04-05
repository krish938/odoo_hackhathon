const {
  createPayment,
  getOrderPayments,
  listAllPayments,
} = require('./payments.service');

const createPaymentController = async (req, res, next) => {
  try {
    const payment = await createPayment(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const getOrderPaymentsController = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payments = await getOrderPayments(orderId);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const listAllPaymentsController = async (req, res, next) => {
  try {
    const filters = req.query;
    const payments = await listAllPayments(filters);
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentController,
  getOrderPaymentsController,
  listAllPaymentsController,
};
