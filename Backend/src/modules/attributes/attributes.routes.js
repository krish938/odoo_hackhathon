const express = require('express');
const {
  createAttributeController,
  listAttributesController,
  createAttributeValueController,
  deleteAttributeValueController,
} = require('./attributes.controller');
const {
  createAttributeSchema,
  createAttributeValueSchema,
  deleteAttributeValueSchema,
} = require('./attributes.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/attributes - List attributes (all authenticated users)
router.get('/', listAttributesController);

// POST /api/attributes - Create attribute (admin/manager only)
router.post(
  '/',
  requireRole(['admin']),
  validate(createAttributeSchema),
  createAttributeController
);

// POST /api/attributes/:id/values - Create attribute value (admin/manager only)
router.post(
  '/:id/values',
  requireRole(['admin']),
  validate(createAttributeValueSchema),
  createAttributeValueController
);

// DELETE /api/attributes/:id/values/:valueId - Delete attribute value (admin/manager only)
router.delete(
  '/:id/values/:valueId',
  requireRole(['admin']),
  validate(deleteAttributeValueSchema),
  deleteAttributeValueController
);

module.exports = router;

