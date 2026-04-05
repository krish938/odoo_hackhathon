const { query, pool } = require('../../config/db');

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${timestamp}-${random}`;
};

const createOrder = async (orderData) => {
  const { session_id, table_id, source } = orderData;

  const sessionCheck = await query(
    'SELECT id FROM sessions WHERE id = $1 AND status = $2',
    [session_id, 'OPEN']
  );

  if (sessionCheck.rows.length === 0) {
    throw { status: 400, message: 'Invalid or closed session' };
  }

  if (table_id) {
    const tableCheck = await query(
      'SELECT id FROM tables WHERE id = $1 AND is_active = true',
      [table_id]
    );

    if (tableCheck.rows.length === 0) {
      throw { status: 400, message: 'Invalid or inactive table' };
    }
  }

  const order_number = generateOrderNumber();

  const result = await query(
    `INSERT INTO orders (session_id, table_id, source, order_number)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [session_id, table_id || null, source, order_number]
  );

  await query(
    'INSERT INTO order_logs (order_id, status) VALUES ($1, $2)',
    [result.rows[0].id, 'CREATED']
  );

  return result.rows[0];
};

// addOrderItem wrapped in transaction to prevent partial inserts
const addOrderItem = async (orderId, itemData) => {
  const { product_id, quantity, attribute_value_ids = [] } = itemData;

  const orderCheck = await query(
    'SELECT id FROM orders WHERE id = $1 AND status IN ($2, $3)',
    [orderId, 'CREATED', 'IN_PROGRESS']
  );

  if (orderCheck.rows.length === 0) {
    throw { status: 400, message: 'Order not found or cannot be modified' };
  }

  const productResult = await query(
    `SELECT p.base_price, p.name, c.send_to_kitchen as category_send_to_kitchen, p.send_to_kitchen
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1 AND p.is_active = true`,
    [product_id]
  );

  if (productResult.rows.length === 0) {
    throw { status: 400, message: 'Product not found or inactive' };
  }

  const product = productResult.rows[0];
  let extraPriceTotal = 0;
  let attrValueRows = [];

  if (attribute_value_ids.length > 0) {
    const attrValuesResult = await query(
      `SELECT id, extra_price FROM attribute_values WHERE id = ANY($1::int[])`,
      [attribute_value_ids]
    );

    if (attrValuesResult.rows.length !== attribute_value_ids.length) {
      throw { status: 400, message: 'One or more attribute values not found' };
    }

    attrValueRows = attrValuesResult.rows;
    extraPriceTotal = attrValueRows.reduce((sum, row) => sum + parseFloat(row.extra_price), 0);
  }

  const base_price = parseFloat(product.base_price);
  const unit_price = base_price + extraPriceTotal;

  // Transaction: insert order_item + options + update total atomically
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, base_price, unit_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, product_id, quantity, base_price, unit_price]
    );

    const orderItem = result.rows[0];

    if (attribute_value_ids.length > 0) {
      // Parameterized bulk insert for options (safe from SQL injection)
      const optionParams = [];
      const optionValues = attribute_value_ids.map((attrValueId, i) => {
        optionParams.push(orderItem.id, attrValueId);
        return `($${i * 2 + 1}, $${i * 2 + 2})`;
      });

      await client.query(
        `INSERT INTO order_item_options (order_item_id, attribute_value_id) VALUES ${optionValues.join(', ')}`,
        optionParams
      );
    }

    await client.query(
      `UPDATE orders
       SET total_amount = (
         SELECT COALESCE(SUM(unit_price * quantity), 0)
         FROM order_items
         WHERE order_id = $1
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
    return orderItem;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateOrderItem = async (orderId, itemId, quantity) => {
  const itemCheck = await query(
    `SELECT oi.id FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.id = $1 AND oi.order_id = $2 AND o.status IN ($3, $4)`,
    [itemId, orderId, 'CREATED', 'IN_PROGRESS']
  );

  if (itemCheck.rows.length === 0) {
    throw { status: 404, message: 'Order item not found or cannot be modified' };
  }

  const result = await query(
    'UPDATE order_items SET quantity = $1 WHERE id = $2 RETURNING *',
    [quantity, itemId]
  );

  await query(
    `UPDATE orders
     SET total_amount = (
       SELECT COALESCE(SUM(unit_price * quantity), 0)
       FROM order_items
       WHERE order_id = $1
     ),
     updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [orderId]
  );

  return result.rows[0];
};

const deleteOrderItem = async (orderId, itemId) => {
  const itemCheck = await query(
    `SELECT oi.id FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.id = $1 AND oi.order_id = $2 AND o.status IN ($3, $4)`,
    [itemId, orderId, 'CREATED', 'IN_PROGRESS']
  );

  if (itemCheck.rows.length === 0) {
    throw { status: 404, message: 'Order item not found or cannot be deleted' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM order_item_options WHERE order_item_id = $1', [itemId]);
    await client.query('DELETE FROM order_items WHERE id = $1', [itemId]);
    await client.query(
      `UPDATE orders
       SET total_amount = (
         SELECT COALESCE(SUM(unit_price * quantity), 0)
         FROM order_items
         WHERE order_id = $1
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId]
    );
    await client.query('COMMIT');
    return { message: 'Order item deleted successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateOrderStatus = async (orderId, newStatus) => {
  const orderResult = await query(
    'SELECT status FROM orders WHERE id = $1',
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    throw { status: 404, message: 'Order not found' };
  }

  const currentStatus = orderResult.rows[0].status;
  const validTransitions = {
    'CREATED': ['IN_PROGRESS'],
    'IN_PROGRESS': ['COMPLETED'],
    'COMPLETED': ['PAID'],
    'PAID': [],
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw { status: 400, message: `Invalid status transition from ${currentStatus} to ${newStatus}` };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, orderId]
    );
    await client.query(
      'INSERT INTO order_logs (order_id, status) VALUES ($1, $2)',
      [orderId, newStatus]
    );
    await client.query('COMMIT');

    return { message: 'Order status updated successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getOrderById = async (orderId) => {
  const orderResult = await query(
    `SELECT o.*,
            s.responsible_label,
            pt.name as terminal_name,
            t.table_number,
            f.name as floor_name,
            c.name as customer_name,
            c.email as customer_email,
            c.phone as customer_phone
     FROM orders o
     JOIN sessions s ON o.session_id = s.id
     JOIN pos_terminals pt ON s.terminal_id = pt.id
     LEFT JOIN tables t ON o.table_id = t.id
     LEFT JOIN floors f ON t.floor_id = f.id
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE o.id = $1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    throw { status: 404, message: 'Order not found' };
  }

  const order = orderResult.rows[0];

  const itemsResult = await query(
    `SELECT oi.*,
            p.name as product_name,
            COALESCE(
              json_agg(
                json_build_object(
                  'attribute_value_id', oio.attribute_value_id,
                  'attribute_name', a.name,
                  'value', av.value,
                  'extra_price', av.extra_price
                ) ORDER BY a.name
              ) FILTER (WHERE oio.attribute_value_id IS NOT NULL),
              '[]'
            ) as options
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
     LEFT JOIN attribute_values av ON oio.attribute_value_id = av.id
     LEFT JOIN attributes a ON av.attribute_id = a.id
     WHERE oi.order_id = $1
     GROUP BY oi.id, p.name
     ORDER BY oi.id`,
    [orderId]
  );

  order.items = itemsResult.rows;
  return order;
};

const listOrders = async (filters = {}) => {
  const { session_id, table_id, status, source, page = 1, limit = 50 } = filters;
  const safeLimit = Math.min(parseInt(limit) || 50, 200);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (session_id) {
    whereClause += ` AND o.session_id = $${paramIndex++}`;
    params.push(session_id);
  }

  if (table_id) {
    whereClause += ` AND o.table_id = $${paramIndex++}`;
    params.push(table_id);
  }

  if (status) {
    const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
    const allowed = new Set(['CREATED', 'IN_PROGRESS', 'COMPLETED', 'PAID']);
    const filtered = statuses.filter(s => allowed.has(s));
    if (filtered.length === 1) {
      whereClause += ` AND o.status = $${paramIndex++}`;
      params.push(filtered[0]);
    } else if (filtered.length > 1) {
      whereClause += ` AND o.status = ANY($${paramIndex++}::text[])`;
      params.push(filtered);
    }
  }

  if (source) {
    whereClause += ` AND o.source = $${paramIndex++}`;
    params.push(source);
  }

  const result = await query(
    `SELECT o.*,
            s.responsible_label,
            t.table_number,
            f.name as floor_name,
            c.name as customer_name,
            COUNT(oi.id) as item_count
     FROM orders o
     JOIN sessions s ON o.session_id = s.id
     LEFT JOIN tables t ON o.table_id = t.id
     LEFT JOIN floors f ON t.floor_id = f.id
     LEFT JOIN customers c ON o.customer_id = c.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     ${whereClause}
     GROUP BY o.id, s.responsible_label, t.table_number, f.name, c.name
     ORDER BY o.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, safeLimit, offset]
  );

  return result.rows;
};

const sendToKitchen = async (orderId, app) => {
  const orderCheck = await query(
    'SELECT id, status, order_number FROM orders WHERE id = $1',
    [orderId]
  );

  if (orderCheck.rows.length === 0) {
    throw { status: 404, message: 'Order not found' };
  }

  if (orderCheck.rows[0].status !== 'IN_PROGRESS') {
    throw { status: 400, message: 'Order must be in progress to send to kitchen' };
  }

  // Allow multiple tickets, but only for items not already sent
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemsResult = await client.query(
      `SELECT oi.id, p.name as product_name, oi.quantity,
              p.send_to_kitchen, c.send_to_kitchen as category_send_to_kitchen
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE oi.order_id = $1 AND NOT EXISTS (
         SELECT 1 FROM kitchen_ticket_items kti WHERE kti.order_item_id = oi.id
       )`,
      [orderId]
    );

    const kitchenItems = itemsResult.rows.filter(
      item => item.send_to_kitchen || item.category_send_to_kitchen
    );

    if (kitchenItems.length === 0) {
      await client.query('ROLLBACK');
      return { message: 'No new items require kitchen preparation', ticket_id: null };
    }

    const ticketResult = await client.query(
      'INSERT INTO kitchen_tickets (order_id, status) VALUES ($1, $2) RETURNING id',
      [orderId, 'TO_COOK']
    );

    const ticketId = ticketResult.rows[0].id;

    const itemParams = [];
    const itemValues = kitchenItems.map((item, i) => {
      itemParams.push(ticketId, item.id);
      return `($${i * 2 + 1}, $${i * 2 + 2})`;
    });

    await client.query(
      `INSERT INTO kitchen_ticket_items (ticket_id, order_item_id, status) VALUES ${itemValues.join(', ')}`,
      itemParams
    );

    await client.query('COMMIT');

    // Emit Socket.IO event to kitchen room
    if (app) {
      const io = app.get('io');
      if (io) {
        const orderData = orderCheck.rows[0];
        const tableResult = await query(
          `SELECT t.table_number, f.name as floor_name
           FROM orders o
           LEFT JOIN tables t ON o.table_id = t.id
           LEFT JOIN floors f ON t.floor_id = f.id
           WHERE o.id = $1`,
          [orderId]
        );
        const tableInfo = tableResult.rows[0] || {};

        io.to('kitchen').emit('new_order', {
          ticket_id: ticketId,
          order_id: orderId,
          order_number: orderData.order_number,
          table_number: tableInfo.table_number,
          floor_name: tableInfo.floor_name,
          items: kitchenItems.map(i => ({ name: i.product_name, quantity: i.quantity })),
          created_at: new Date().toISOString(),
        });
      }
    }

    return { message: 'Order sent to kitchen successfully', ticket_id: ticketId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createOrder,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  updateOrderStatus,
  getOrderById,
  listOrders,
  sendToKitchen,
};
