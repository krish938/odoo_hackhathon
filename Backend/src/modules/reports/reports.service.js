const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { query } = require('../../config/db');

const getSummaryReport = async (filters = {}) => {
  const { from, to, session_id, user_id, product_id } = filters;
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (from) { whereClause += ` AND o.created_at >= $${paramIndex++}`; params.push(from); }
  if (to) { whereClause += ` AND o.created_at <= $${paramIndex++}`; params.push(to); }
  if (session_id) { whereClause += ` AND o.session_id = $${paramIndex++}`; params.push(session_id); }
  if (user_id) { whereClause += ` AND s.user_id = $${paramIndex++}`; params.push(user_id); }
  if (product_id) { whereClause += ` AND o.id IN (SELECT order_id FROM order_items WHERE product_id = $${paramIndex++})`; params.push(product_id); }

  const [totalOrdersRes, totalRevenueRes, ordersByStatusRes, topProductsRes, revenueByMethodRes, sessionSummaryRes] = await Promise.all([
    query(`SELECT COUNT(DISTINCT o.id) as total_orders FROM orders o JOIN sessions s ON o.session_id = s.id ${whereClause}`, params),
    query(`SELECT COALESCE(SUM(p.amount), 0) as total_revenue FROM payments p JOIN orders o ON p.order_id = o.id JOIN sessions s ON o.session_id = s.id ${whereClause} AND p.status = 'SUCCESS'`, params),
    query(`SELECT o.status, COUNT(*) as count FROM orders o JOIN sessions s ON o.session_id = s.id ${whereClause} GROUP BY o.status`, params),
    query(`SELECT p.id as product_id, p.name, SUM(oi.quantity) as qty_sold, SUM(oi.unit_price * oi.quantity) as revenue FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id JOIN sessions s ON o.session_id = s.id ${whereClause} GROUP BY p.id, p.name ORDER BY qty_sold DESC LIMIT 10`, params),
    query(`SELECT pm.type, pm.name, COALESCE(SUM(p.amount), 0) as revenue FROM payments p JOIN payment_methods pm ON p.payment_method_id = pm.id JOIN orders o ON p.order_id = o.id JOIN sessions s ON o.session_id = s.id ${whereClause} AND p.status = 'SUCCESS' GROUP BY pm.type, pm.name`, params),
    query(`SELECT s.id as session_id, s.responsible_label, COUNT(DISTINCT o.id) as order_count, COALESCE(SUM(p.amount), 0) as total_sales FROM sessions s LEFT JOIN orders o ON s.id = o.session_id LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'SUCCESS' ${whereClause} GROUP BY s.id, s.responsible_label ORDER BY total_sales DESC`, params),
  ]);

  const ordersByStatus = {};
  ordersByStatusRes.rows.forEach(row => { ordersByStatus[row.status] = parseInt(row.count); });

  const revenueByMethod = {};
  revenueByMethodRes.rows.forEach(row => { revenueByMethod[row.type] = parseFloat(row.revenue); });

  return {
    total_orders: parseInt(totalOrdersRes.rows[0].total_orders),
    total_revenue: parseFloat(totalRevenueRes.rows[0].total_revenue),
    orders_by_status: ordersByStatus,
    top_products: topProductsRes.rows.map(row => ({
      product_id: row.product_id,
      name: row.name,
      qty_sold: parseInt(row.qty_sold),
      revenue: parseFloat(row.revenue),
    })),
    revenue_by_method: revenueByMethod,
    session_summary: sessionSummaryRes.rows.map(row => ({
      session_id: row.session_id,
      responsible_label: row.responsible_label,
      order_count: parseInt(row.order_count),
      total_sales: parseFloat(row.total_sales),
    })),
  };
};

const getOrdersReport = async (filters = {}) => {
  const { from, to, session_id, user_id, product_id, page = 1, limit = 20 } = filters;
  const safeLimit = Math.min(parseInt(limit) || 20, 100);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (from) { whereClause += ` AND o.created_at >= $${paramIndex++}`; params.push(from); }
  if (to) { whereClause += ` AND o.created_at <= $${paramIndex++}`; params.push(to); }
  if (session_id) { whereClause += ` AND o.session_id = $${paramIndex++}`; params.push(session_id); }
  if (user_id) { whereClause += ` AND s.user_id = $${paramIndex++}`; params.push(user_id); }
  if (product_id) { whereClause += ` AND o.id IN (SELECT order_id FROM order_items WHERE product_id = $${paramIndex++})`; params.push(product_id); }

  const countResult = await query(
    `SELECT COUNT(DISTINCT o.id) as total FROM orders o JOIN sessions s ON o.session_id = s.id ${whereClause}`,
    params
  );

  const ordersResult = await query(
    `SELECT o.*, s.responsible_label, t.table_number, f.name as floor_name,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
            COALESCE(o.total_amount, 0) as order_total_amount
     FROM orders o
     JOIN sessions s ON o.session_id = s.id
     LEFT JOIN tables t ON o.table_id = t.id
     LEFT JOIN floors f ON t.floor_id = f.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, safeLimit, offset]
  );

  const total = parseInt(countResult.rows[0].total);
  return {
    orders: ordersResult.rows.map(row => ({
      ...row,
      item_count: parseInt(row.item_count),
      total_amount: parseFloat(row.order_total_amount || row.total_amount || 0),
    })),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
  };
};

/**
 * Export full report as PDF and stream to response.
 */
const exportReportPDF = async (filters, res) => {
  const data = await getSummaryReport(filters);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="sales_report_${Date.now()}.pdf"`);
  doc.pipe(res);

  // Title
  doc.fontSize(22).font('Helvetica-Bold').text('Odoo POS Cafe — Sales Report', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);

  // Summary
  doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Total Orders: ${data.total_orders}`);
  doc.text(`Total Revenue: ₹${data.total_revenue.toFixed(2)}`);
  doc.moveDown();

  // Revenue by Payment Method
  if (Object.keys(data.revenue_by_method).length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Revenue by Payment Method', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    Object.entries(data.revenue_by_method).forEach(([method, amount]) => {
      doc.text(`${method}: ₹${amount.toFixed(2)}`);
    });
    doc.moveDown();
  }

  // Top Products
  if (data.top_products.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Top Products', { underline: true });
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const colX = [40, 250, 370, 470];
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Product', colX[0], tableTop);
    doc.text('Qty Sold', colX[1], tableTop);
    doc.text('Revenue', colX[2], tableTop);
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(10).font('Helvetica');
    data.top_products.forEach((p, i) => {
      const y = doc.y;
      if (i % 2 === 0) {
        doc.rect(40, y - 2, 515, 16).fill('#f5f5f5').stroke('#ffffff');
      }
      doc.fillColor('black');
      doc.text(p.name.substring(0, 30), colX[0], y, { width: 200 });
      doc.text(String(p.qty_sold), colX[1], y);
      doc.text(`₹${p.revenue.toFixed(2)}`, colX[2], y);
      doc.moveDown(0.5);
    });
    doc.moveDown();
  }

  // Session Summary
  if (data.session_summary.length > 0) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('Session Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    data.session_summary.forEach(s => {
      doc.text(`Session #${s.session_id} — ${s.responsible_label || 'N/A'}: ₹${s.total_sales.toFixed(2)} (${s.order_count} orders)`);
    });
  }

  doc.end();
};

/**
 * Export full report as XLSX and stream to response.
 */
const exportReportXLS = async (filters, res) => {
  const data = await getSummaryReport(filters);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Odoo POS Cafe';
  wb.created = new Date();

  // Summary Sheet
  const summarySheet = wb.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 25 },
  ];
  summarySheet.getRow(1).font = { bold: true, size: 12 };
  summarySheet.addRow({ metric: 'Report Generated', value: new Date().toLocaleString() });
  summarySheet.addRow({ metric: 'Total Orders', value: data.total_orders });
  summarySheet.addRow({ metric: 'Total Revenue (₹)', value: parseFloat(data.total_revenue.toFixed(2)) });
  summarySheet.addRow({});
  summarySheet.addRow({ metric: '--- Revenue by Payment Method ---', value: '' });
  Object.entries(data.revenue_by_method).forEach(([method, amount]) => {
    summarySheet.addRow({ metric: method, value: parseFloat(amount.toFixed(2)) });
  });

  // Top Products Sheet
  const productsSheet = wb.addWorksheet('Top Products');
  productsSheet.columns = [
    { header: 'Product', key: 'name', width: 35 },
    { header: 'Qty Sold', key: 'qty_sold', width: 15 },
    { header: 'Revenue (₹)', key: 'revenue', width: 20 },
  ];
  productsSheet.getRow(1).font = { bold: true };
  data.top_products.forEach(p => {
    productsSheet.addRow({ name: p.name, qty_sold: p.qty_sold, revenue: parseFloat(p.revenue.toFixed(2)) });
  });

  // Session Summary Sheet
  const sessionsSheet = wb.addWorksheet('Session Summary');
  sessionsSheet.columns = [
    { header: 'Session ID', key: 'session_id', width: 15 },
    { header: 'Responsible', key: 'responsible_label', width: 25 },
    { header: 'Orders', key: 'order_count', width: 12 },
    { header: 'Total Sales (₹)', key: 'total_sales', width: 20 },
  ];
  sessionsSheet.getRow(1).font = { bold: true };
  data.session_summary.forEach(s => {
    sessionsSheet.addRow({
      session_id: s.session_id,
      responsible_label: s.responsible_label || 'N/A',
      order_count: s.order_count,
      total_sales: parseFloat(s.total_sales.toFixed(2)),
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="sales_report_${Date.now()}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
};

module.exports = {
  getSummaryReport,
  getOrdersReport,
  exportReportPDF,
  exportReportXLS,
};
