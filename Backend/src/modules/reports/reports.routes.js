const express = require('express');
const {
  summaryReportController,
  ordersReportController,
} = require('./reports.controller');
const {
  summaryReportSchema,
  ordersReportSchema,
} = require('./reports.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

// All routes require authentication and admin/manager role
router.use(verifyToken);
router.use(requireRole(['admin', 'manager']));

// GET /api/reports/summary - Get summary report (admin/manager only)
router.get('/summary', validate(summaryReportSchema), summaryReportController);

// GET /api/reports/orders - Get orders report (admin/manager only)
router.get('/orders', validate(ordersReportSchema), ordersReportController);

module.exports = router;
