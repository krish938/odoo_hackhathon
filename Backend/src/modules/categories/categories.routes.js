const express = require('express');
const {
  createCategoryController,
  getCategoryController,
  listCategoriesController,
  updateCategoryController,
  deleteCategoryController,
} = require('./categories.controller');
const {
  createCategorySchema,
  updateCategorySchema,
  getCategorySchema,
} = require('./categories.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/categories - List categories (all authenticated users)
router.get('/', listCategoriesController);

// GET /api/categories/:id - Get category by ID (all authenticated users)
router.get('/:id', validate(getCategorySchema), getCategoryController);

// POST /api/categories - Create category (admin/manager only)
router.post(
  '/',
  requireRole(['admin', 'manager']),
  validate(createCategorySchema),
  createCategoryController
);

// PUT /api/categories/:id - Update category (admin/manager only)
router.put(
  '/:id',
  requireRole(['admin', 'manager']),
  validate(updateCategorySchema),
  updateCategoryController
);

// DELETE /api/categories/:id - Delete category (admin/manager only)
router.delete(
  '/:id',
  requireRole(['admin', 'manager']),
  validate(getCategorySchema),
  deleteCategoryController
);

module.exports = router;
