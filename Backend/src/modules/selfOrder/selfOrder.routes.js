const express = require('express');
const {
  createTokenController,
  getMenuController,
  createSelfOrderController,
  invalidateTokenController,
} = require('./selfOrder.controller');
const {
  createTokenSchema,
  getMenuSchema,
  createSelfOrderSchema,
} = require('./selfOrder.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// POST /api/self-order/tokens - Create self-order token (admin/manager only)
router.post(
  '/tokens',
  verifyToken,
  requireRole(['admin']),
  validate(createTokenSchema),
  createTokenController
);

// DELETE /api/self-order/tokens/:token - Invalidate a self-order token
router.delete(
  '/tokens/:token',
  verifyToken,
  requireRole(['admin']),
  invalidateTokenController
);

// GET /api/self-order/menu - Get menu (no auth required, token-based)
router.get('/menu', validate(getMenuSchema), getMenuController);

// POST /api/self-order/orders - Create self-order (no auth required, token-based)
router.post('/orders', validate(createSelfOrderSchema), createSelfOrderController);

module.exports = router;

