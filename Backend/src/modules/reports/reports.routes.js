const express = require('express');
const {
  summaryReportController,
  ordersReportController,
  exportPDFController,
  exportXLSController,
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
router.use(requireRole(['admin']));

// GET /api/reports/summary
router.get('/summary', validate(summaryReportSchema), summaryReportController);

// GET /api/reports/orders
router.get('/orders', validate(ordersReportSchema), ordersReportController);

// GET /api/reports/export/pdf
router.get('/export/pdf', exportPDFController);

// GET /api/reports/export/xls
router.get('/export/xls', exportXLSController);

module.exports = router;

