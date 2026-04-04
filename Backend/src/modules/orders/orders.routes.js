const express = require('express');
const {
  createOrderController,
  addOrderItemController,
  updateOrderItemController,
  deleteOrderItemController,
  updateOrderStatusController,
  getOrderController,
  listOrdersController,
  sendToKitchenController,
} = require('./orders.controller');
const {
  createOrderSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  deleteOrderItemSchema,
  updateOrderStatusSchema,
  getOrderSchema,
  listOrdersSchema,
  sendToKitchenSchema,
} = require('./orders.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// POST /api/orders - Create order (all authenticated users)
router.post('/', validate(createOrderSchema), createOrderController);

// GET /api/orders - List orders (all authenticated users)
router.get('/', validate(listOrdersSchema), listOrdersController);

// GET /api/orders/:id - Get order by ID (all authenticated users)
router.get('/:id', validate(getOrderSchema), getOrderController);

// POST /api/orders/:id/items - Add item to order (all authenticated users)
router.post('/:id/items', validate(addOrderItemSchema), addOrderItemController);

// PUT /api/orders/:id/items/:itemId - Update order item (all authenticated users)
router.put('/:id/items/:itemId', validate(updateOrderItemSchema), updateOrderItemController);

// DELETE /api/orders/:id/items/:itemId - Delete order item (all authenticated users)
router.delete('/:id/items/:itemId', validate(deleteOrderItemSchema), deleteOrderItemController);

// PUT /api/orders/:id/status - Update order status (all authenticated users)
router.put('/:id/status', validate(updateOrderStatusSchema), updateOrderStatusController);

// POST /api/orders/:id/send-to-kitchen - Send order to kitchen (all authenticated users)
router.post('/:id/send-to-kitchen', validate(sendToKitchenSchema), sendToKitchenController);

module.exports = router;
