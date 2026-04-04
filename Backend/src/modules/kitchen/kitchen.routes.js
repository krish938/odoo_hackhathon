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
const { verifyToken } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// GET routes are PUBLIC — Kitchen Display polls without auth
router.get('/tickets', validate(listTicketsSchema), listTicketsController);
router.get('/tickets/:id', validate(getTicketSchema), getTicketController);

// PUT routes require authentication — staff must be logged in to update status
router.put('/tickets/:id/status', verifyToken, validate(updateTicketStatusSchema), updateTicketStatusController);
router.put('/tickets/:id/items/:itemId/status', verifyToken, validate(updateTicketItemStatusSchema), updateTicketItemStatusController);

module.exports = router;
