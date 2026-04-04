const { query } = require('../../config/db');

const getSummaryReport = async (filters = {}) => {
  const { from, to, session_id, user_id, product_id } = filters;
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (from) {
    whereClause += ` AND o.created_at >= $${paramIndex++}`;
    params.push(from);
  }

  if (to) {
    whereClause += ` AND o.created_at <= $${paramIndex++}`;
    params.push(to);
  }

  if (session_id) {
    whereClause += ` AND o.session_id = $${paramIndex++}`;
    params.push(session_id);
  }

  if (user_id) {
    whereClause += ` AND s.user_id = $${paramIndex++}`;
    params.push(user_id);
  }

  if (product_id) {
    whereClause += ` AND oi.product_id = $${paramIndex++}`;
    params.push(product_id);
  }

  const totalOrdersResult = await query(
    `SELECT COUNT(DISTINCT o.id) as total_orders
     FROM orders o
     JOIN sessions s ON o.session_id = s.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     ${whereClause}`,
    params
  );

  const totalRevenueResult = await query(
    `SELECT COALESCE(SUM(p.amount), 0) as total_revenue
     FROM payments p
     JOIN orders o ON p.order_id = o.id
     JOIN sessions s ON o.session_id = s.id
     ${whereClause} AND p.status = 'SUCCESS'`,
    params
  );

  const ordersByStatusResult = await query(
    `SELECT o.status, COUNT(*) as count
     FROM orders o
     JOIN sessions s ON o.session_id = s.id
     ${whereClause}
     GROUP BY o.status`,
    params
  );

  const topProductsResult = await query(
    `SELECT p.id as product_id, p.name, 
            SUM(oi.quantity) as qty_sold,
            SUM(oi.unit_price * oi.quantity) as revenue
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN orders o ON oi.order_id = o.id
     JOIN sessions s ON o.session_id = s.id
     ${whereClause}
     GROUP BY p.id, p.name
     ORDER BY qty_sold DESC
     LIMIT 10`,
    params
  );

  const revenueByMethodResult = await query(
    `SELECT pm.type, COALESCE(SUM(p.amount), 0) as revenue
     FROM payments p
     JOIN payment_methods pm ON p.payment_method_id = pm.id
     JOIN orders o ON p.order_id = o.id
     JOIN sessions s ON o.session_id = s.id
     ${whereClause} AND p.status = 'SUCCESS'
     GROUP BY pm.type`,
    params
  );

  const sessionSummaryResult = await query(
    `SELECT s.id as session_id, s.responsible_label,
            COUNT(DISTINCT o.id) as order_count,
            COALESCE(SUM(p.amount), 0) as total_sales
     FROM sessions s
     LEFT JOIN orders o ON s.id = o.session_id
     LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'SUCCESS'
     ${whereClause}
     GROUP BY s.id, s.responsible_label
     ORDER BY total_sales DESC`,
    params
  );

  const ordersByStatus = {};
  ordersByStatusResult.rows.forEach(row => {
    ordersByStatus[row.status] = parseInt(row.count);
  });

  const revenueByMethod = {};
  revenueByMethodResult.rows.forEach(row => {
    revenueByMethod[row.type] = parseFloat(row.revenue);
  });

  return {
    total_orders: parseInt(totalOrdersResult.rows[0].total_orders),
    total_revenue: parseFloat(totalRevenueResult.rows[0].total_revenue),
    orders_by_status: ordersByStatus,
    top_products: topProductsResult.rows.map(row => ({
      product_id: row.product_id,
      name: row.name,
      qty_sold: parseInt(row.qty_sold),
      revenue: parseFloat(row.revenue),
    })),
    revenue_by_method: revenueByMethod,
    session_summary: sessionSummaryResult.rows.map(row => ({
      session_id: row.session_id,
      responsible_label: row.responsible_label,
      total_sales: parseFloat(row.total_sales),
    })),
  };
};

const getOrdersReport = async (filters = {}) => {
  const { from, to, session_id, user_id, product_id, page = 1, limit = 20 } = filters;
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  const offset = (page - 1) * limit;

  if (from) {
    whereClause += ` AND o.created_at >= $${paramIndex++}`;
    params.push(from);
  }

  if (to) {
    whereClause += ` AND o.created_at <= $${paramIndex++}`;
    params.push(to);
  }

  if (session_id) {
    whereClause += ` AND o.session_id = $${paramIndex++}`;
    params.push(session_id);
  }

  if (user_id) {
    whereClause += ` AND s.user_id = $${paramIndex++}`;
    params.push(user_id);
  }

  if (product_id) {
    whereClause += ` AND oi.product_id = $${paramIndex++}`;
    params.push(product_id);
  }

  const countResult = await query(
    `SELECT COUNT(DISTINCT o.id) as total
     FROM orders o
     JOIN sessions s ON o.session_id = s.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     ${whereClause}`,
    params
  );

  const ordersResult = await query(
    `SELECT DISTINCT o.*, 
            s.responsible_label,
            t.table_number,
            f.name as floor_name,
            COUNT(oi.id) as item_count,
            COALESCE(o.total_amount, 0) as total_amount
     FROM orders o
     JOIN sessions s ON o.session_id = s.id
     LEFT JOIN tables t ON o.table_id = t.id
     LEFT JOIN floors f ON t.floor_id = f.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     ${whereClause}
     GROUP BY o.id, s.responsible_label, t.table_number, f.name
     ORDER BY o.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    orders: ordersResult.rows.map(row => ({
      ...row,
      item_count: parseInt(row.item_count),
      total_amount: parseFloat(row.total_amount),
    })),
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_records: total,
      per_page: limit,
    },
  };
};

module.exports = {
  getSummaryReport,
  getOrdersReport,
};
