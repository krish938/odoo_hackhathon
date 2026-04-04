const express = require('express');
const {
  createFloorController,
  listFloorsController,
  getFloorController,
  updateFloorController,
  deleteFloorController,
} = require('./floors.controller');
const {
  createFloorSchema,
  getFloorSchema,
  updateFloorSchema,
  deleteFloorSchema,
} = require('./floors.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/floors - List floors (all authenticated users)
router.get('/', listFloorsController);

// GET /api/floors/:id - Get floor by ID (all authenticated users)
router.get('/:id', validate(getFloorSchema), getFloorController);

// POST /api/floors - Create floor (admin/manager only)
router.post(
  '/',
  requireRole(['admin', 'manager']),
  validate(createFloorSchema),
  createFloorController
);

// PUT /api/floors/:id - Update floor (admin/manager only)
router.put(
  '/:id',
  requireRole(['admin', 'manager']),
  validate(updateFloorSchema),
  updateFloorController
);

// DELETE /api/floors/:id - Delete floor (admin/manager only)
router.delete(
  '/:id',
  requireRole(['admin', 'manager']),
  validate(deleteFloorSchema),
  deleteFloorController
);

module.exports = router;
