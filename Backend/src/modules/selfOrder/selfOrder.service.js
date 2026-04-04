const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/db');

const createSelfOrderToken = async (tableId, sessionId) => {
  const tableCheck = await query(
    'SELECT id FROM tables WHERE id = $1 AND is_active = true',
    [tableId]
  );

  if (tableCheck.rows.length === 0) {
    throw { status: 400, message: 'Table not found or inactive' };
  }

  const sessionCheck = await query(
    'SELECT id FROM sessions WHERE id = $1 AND status = $2',
    [sessionId, 'OPEN']
  );

  if (sessionCheck.rows.length === 0) {
    throw { status: 400, message: 'Invalid or closed session' };
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const token = uuidv4();

  const result = await query(
    `INSERT INTO self_order_tokens (token, table_id, session_id, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING token, expires_at, table_id`,
    [token, tableId, sessionId, expiresAt]
  );

  return result.rows[0];
};

const validateToken = async (token) => {
  const result = await query(
    `SELECT sot.*, t.table_number, f.name as floor_name
     FROM self_order_tokens sot
     JOIN tables t ON sot.table_id = t.id
     JOIN floors f ON t.floor_id = f.id
     WHERE sot.token = $1 AND sot.is_active = true AND sot.expires_at > CURRENT_TIMESTAMP`,
    [token]
  );

  if (result.rows.length === 0) {
    throw { status: 401, message: 'Invalid or expired token' };
  }

  return result.rows[0];
};

const getMenu = async (token) => {
  await validateToken(token);

  const result = await query(
    `SELECT c.id as category_id, c.name as category_name,
            p.id as product_id, p.name as product_name, p.base_price, p.description,
            COALESCE(
              json_agg(
                json_build_object(
                  'attribute_id', a.id,
                  'attribute_name', a.name,
                  'values', (
                    SELECT json_agg(
                      json_build_object(
                        'id', av.id,
                        'value', av.value,
                        'extra_price', av.extra_price
                      )
                    )
                    FROM attribute_values av
                    WHERE av.attribute_id = a.id
                  )
                ) ORDER BY a.name
              ) FILTER (WHERE a.id IS NOT NULL), 
              '[]'
            ) as attributes
     FROM categories c
     LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
     LEFT JOIN (
       SELECT DISTINCT av.attribute_id
       FROM attribute_values av
     ) a ON true
     WHERE c.id IN (SELECT DISTINCT category_id FROM products WHERE is_active = true)
     GROUP BY c.id, c.name, p.id, p.name, p.base_price, p.description
     ORDER BY c.name, p.name`
  );

  const menu = {};
  result.rows.forEach(row => {
    if (!menu[row.category_id]) {
      menu[row.category_id] = {
        id: row.category_id,
        name: row.category_name,
        products: []
      };
    }

    if (row.product_id) {
      menu[row.category_id].products.push({
        id: row.product_id,
        name: row.product_name,
        base_price: parseFloat(row.base_price),
        description: row.description,
        attributes: row.attributes
      });
    }
  });

  return Object.values(menu);
};

const createSelfOrder = async (token, orderData) => {
  const tokenData = await validateToken(token);
  const { items } = orderData;

  await query('BEGIN');

  try {
    const order_number = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const orderResult = await query(
      `INSERT INTO orders (session_id, table_id, source, order_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tokenData.session_id, tokenData.table_id, 'SELF', order_number]
    );

    const order = orderResult.rows[0];

    await query(
      'INSERT INTO order_logs (order_id, status) VALUES ($1, $2)',
      [order.id, 'CREATED']
    );

    for (const item of items) {
      const { product_id, quantity, attribute_value_ids = [] } = item;

      const productResult = await query(
        `SELECT p.base_price, p.name, c.send_to_kitchen as category_send_to_kitchen, p.send_to_kitchen
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.id = $1 AND p.is_active = true`,
        [product_id]
      );

      if (productResult.rows.length === 0) {
        throw { status: 400, message: `Product ${product_id} not found or inactive` };
      }

      const product = productResult.rows[0];
      let extraPriceTotal = 0;

      if (attribute_value_ids.length > 0) {
        const attrValuesResult = await query(
          `SELECT id, extra_price FROM attribute_values 
           WHERE id = ANY($1::int[])`,
          [attribute_value_ids]
        );

        if (attrValuesResult.rows.length !== attribute_value_ids.length) {
          throw { status: 400, message: 'One or more attribute values not found' };
        }

        extraPriceTotal = attrValuesResult.rows.reduce((sum, row) => sum + parseFloat(row.extra_price), 0);
      }

      const base_price = parseFloat(product.base_price);
      const unit_price = base_price + extraPriceTotal;

      const orderItemResult = await query(
        `INSERT INTO order_items (order_id, product_id, quantity, base_price, unit_price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [order.id, product_id, quantity, base_price, unit_price]
      );

      const orderItem = orderItemResult.rows[0];

      if (attribute_value_ids.length > 0) {
        const optionParams = [];
        const optionValues = attribute_value_ids.map((attrValueId, i) => {
          optionParams.push(orderItem.id, attrValueId);
          return `($${i * 2 + 1}, $${i * 2 + 2})`;
        });

        await query(
          `INSERT INTO order_item_options (order_item_id, attribute_value_id) VALUES ${optionValues.join(', ')}`,
          optionParams
        );
      }
    }

    await query(
      `UPDATE orders 
       SET total_amount = (
         SELECT COALESCE(SUM(unit_price * quantity), 0) 
         FROM order_items 
         WHERE order_id = $1
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [order.id]
    );

    await query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['IN_PROGRESS', order.id]
    );

    await query(
      'INSERT INTO order_logs (order_id, status) VALUES ($1, $2)',
      [order.id, 'IN_PROGRESS']
    );

    const kitchenItems = await query(
      `SELECT oi.id, p.send_to_kitchen, c.send_to_kitchen as category_send_to_kitchen
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    const kitchenEligibleItems = kitchenItems.rows.filter(item => 
      item.send_to_kitchen || item.category_send_to_kitchen
    );

    if (kitchenEligibleItems.length > 0) {
      const ticketResult = await query(
        'INSERT INTO kitchen_tickets (order_id, status) VALUES ($1, $2) RETURNING id',
        [order.id, 'TO_COOK']
      );

      const ticketId = ticketResult.rows[0].id;

      const itemParams = [];
      const itemValues = kitchenEligibleItems.map((item, i) => {
        itemParams.push(ticketId, item.id);
        return `($${i * 2 + 1}, $${i * 2 + 2})`;
      });
      await query(
        `INSERT INTO kitchen_ticket_items (ticket_id, order_item_id, status) VALUES ${itemValues.join(', ')}`,
        itemParams
      );
    }

    await query('COMMIT');

    const fullOrder = await query(
      `SELECT o.*, 
              s.responsible_label,
              pt.name as terminal_name,
              t.table_number,
              f.name as floor_name
       FROM orders o
       JOIN sessions s ON o.session_id = s.id
       JOIN pos_terminals pt ON s.terminal_id = pt.id
       LEFT JOIN tables t ON o.table_id = t.id
       LEFT JOIN floors f ON t.floor_id = f.id
       WHERE o.id = $1`,
      [order.id]
    );

    return fullOrder.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

const invalidateToken = async (token) => {
  const result = await query(
    'UPDATE self_order_tokens SET is_active = false WHERE token = $1 RETURNING token',
    [token]
  );
  if (result.rows.length === 0) {
    throw { status: 404, message: 'Token not found' };
  }
  return { message: 'Token invalidated successfully' };
};

module.exports = {
  createSelfOrderToken,
  getMenu,
  createSelfOrder,
  invalidateToken,
};
