const {
  getSummaryReport,
  getOrdersReport,
  exportReportPDF,
  exportReportXLS,
} = require('./reports.service');

const summaryReportController = async (req, res, next) => {
  try {
    const report = await getSummaryReport(req.query);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const ordersReportController = async (req, res, next) => {
  try {
    const report = await getOrdersReport(req.query);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const exportPDFController = async (req, res, next) => {
  try {
    await exportReportPDF(req.query, res);
  } catch (error) {
    if (!res.headersSent) next(error);
  }
};

const exportXLSController = async (req, res, next) => {
  try {
    await exportReportXLS(req.query, res);
  } catch (error) {
    if (!res.headersSent) next(error);
  }
};

module.exports = {
  summaryReportController,
  ordersReportController,
  exportPDFController,
  exportXLSController,
};
