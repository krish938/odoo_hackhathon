const express = require('express');
const {
  createProductController,
  getProductController,
  listProductsController,
  updateProductController,
  deleteProductController,
} = require('./products.controller');
const {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  listProductsSchema,
} = require('./products.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/products - List products (all authenticated users)
router.get('/', validate(listProductsSchema), listProductsController);

// GET /api/products/:id - Get product by ID (all authenticated users)
router.get('/:id', validate(getProductSchema), getProductController);

// POST /api/products - Create product (admin/manager only)
router.post(
  '/',
  requireRole(['admin', 'manager']),
  validate(createProductSchema),
  createProductController
);

// PUT /api/products/:id - Update product (admin/manager only)
router.put(
  '/:id',
  requireRole(['admin', 'manager']),
  validate(updateProductSchema),
  updateProductController
);

// DELETE /api/products/:id - Soft delete product (admin/manager only)
router.delete(
  '/:id',
  requireRole(['admin', 'manager']),
  validate(getProductSchema),
  deleteProductController
);

module.exports = router;
