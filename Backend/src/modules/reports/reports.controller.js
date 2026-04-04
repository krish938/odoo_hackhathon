const {
  getSummaryReport,
  getOrdersReport,
} = require('./reports.service');

const summaryReportController = async (req, res, next) => {
  try {
    const report = await getSummaryReport(req.query);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

const ordersReportController = async (req, res, next) => {
  try {
    const report = await getOrdersReport(req.query);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  summaryReportController,
  ordersReportController,
};
