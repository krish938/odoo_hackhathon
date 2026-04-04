const {
  createPayment,
  getOrderPayments,
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

module.exports = {
  createPaymentController,
  getOrderPaymentsController,
};
