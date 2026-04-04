const express = require('express');
const {
  listTicketsController,
  getTicketController,
  updateTicketStatusController,
  updateTicketItemStatusController,
} = require('./kitchen.controller');
const {
  listTicketsSchema,
  getTicketSchema,
  updateTicketStatusSchema,
  updateTicketItemStatusSchema,
} = require('./kitchen.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/kitchen/tickets - List kitchen tickets (all authenticated users)
router.get('/tickets', validate(listTicketsSchema), listTicketsController);

// GET /api/kitchen/tickets/:id - Get kitchen ticket by ID (all authenticated users)
router.get('/tickets/:id', validate(getTicketSchema), getTicketController);

// PUT /api/kitchen/tickets/:id/status - Update ticket status (all authenticated users)
router.put('/tickets/:id/status', validate(updateTicketStatusSchema), updateTicketStatusController);

// PUT /api/kitchen/tickets/:id/items/:itemId/status - Update ticket item status (all authenticated users)
router.put('/tickets/:id/items/:itemId/status', validate(updateTicketItemStatusSchema), updateTicketItemStatusController);

module.exports = router;
