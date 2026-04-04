const {
  createPaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
} = require('./paymentMethods.service');

const createPaymentMethodController = async (req, res, next) => {
  try {
    const paymentMethod = await createPaymentMethod(req.body);
    res.status(201).json(paymentMethod);
  } catch (error) {
    next(error);
  }
};

const listPaymentMethodsController = async (req, res, next) => {
  try {
    const paymentMethods = await listPaymentMethods();
    res.json(paymentMethods);
  } catch (error) {
    next(error);
  }
};

const updatePaymentMethodController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentMethod = await updatePaymentMethod(id, req.body);
    res.json(paymentMethod);
  } catch (error) {
    next(error);
  }
};

const deletePaymentMethodController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deletePaymentMethod(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentMethodController,
  listPaymentMethodsController,
  updatePaymentMethodController,
  deletePaymentMethodController,
};
