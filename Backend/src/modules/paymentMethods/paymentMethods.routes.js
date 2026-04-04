const express = require('express');
const {
  createPaymentMethodController,
  listPaymentMethodsController,
  updatePaymentMethodController,
  deletePaymentMethodController,
} = require('./paymentMethods.controller');
const {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  deletePaymentMethodSchema,
} = require('./paymentMethods.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/payment-methods - List payment methods (all authenticated users)
router.get('/', listPaymentMethodsController);

// POST /api/payment-methods - Create payment method (admin only)
router.post(
  '/',
  requireRole(['admin']),
  validate(createPaymentMethodSchema),
  createPaymentMethodController
);

// PUT /api/payment-methods/:id - Update payment method (admin only)
router.put(
  '/:id',
  requireRole(['admin']),
  validate(updatePaymentMethodSchema),
  updatePaymentMethodController
);

// DELETE /api/payment-methods/:id - Delete payment method (admin only)
router.delete(
  '/:id',
  requireRole(['admin']),
  validate(deletePaymentMethodSchema),
  deletePaymentMethodController
);

module.exports = router;
