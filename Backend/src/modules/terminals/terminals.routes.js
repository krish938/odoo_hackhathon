const express = require('express');
const {
  createTerminalController,
  listTerminalsController,
  getTerminalController,
} = require('./terminals.controller');
const {
  createTerminalSchema,
  getTerminalSchema,
} = require('./terminals.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/terminals - List terminals (all authenticated users)
router.get('/', listTerminalsController);

// GET /api/terminals/:id - Get terminal by ID (all authenticated users)
router.get('/:id', validate(getTerminalSchema), getTerminalController);

// POST /api/terminals - Create terminal (admin/manager only)
router.post(
  '/',
  requireRole(['admin']),
  validate(createTerminalSchema),
  createTerminalController
);

module.exports = router;

