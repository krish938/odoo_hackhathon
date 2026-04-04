const express = require('express');
const {
  createPaymentController,
  getOrderPaymentsController,
} = require('./payments.controller');
const {
  createPaymentSchema,
  getOrderPaymentsSchema,
} = require('./payments.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// POST /api/payments - Create payment (all authenticated users)
router.post('/', validate(createPaymentSchema), createPaymentController);

// GET /api/payments/:orderId - Get payments for an order (all authenticated users)
router.get('/:orderId', validate(getOrderPaymentsSchema), getOrderPaymentsController);

module.exports = router;
