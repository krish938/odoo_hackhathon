const { query, pool } = require('../../config/db');

const listKitchenTickets = async (filters = {}) => {
  const { status } = filters;
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (status) {
    whereClause += ` AND kt.status = $${paramIndex++}`;
    params.push(status);
  }

  const result = await query(
    `SELECT kt.*,
            o.order_number,
            o.source,
            o.created_at as order_created_at,
            t.table_number,
            f.name as floor_name
     FROM kitchen_tickets kt
     JOIN orders o ON kt.order_id = o.id
     LEFT JOIN tables t ON o.table_id = t.id
     LEFT JOIN floors f ON t.floor_id = f.id
     ${whereClause}
     ORDER BY kt.created_at ASC`,
    params
  );

  const tickets = result.rows;
  if (tickets.length === 0) return [];

  // Fetch all items for these tickets in one query (avoid N+1)
  const ticketIds = tickets.map(t => t.id);
  const itemsResult = await query(
    `SELECT kti.id, kti.ticket_id, kti.status,
            oi.quantity,
            p.name as product_name,
            COALESCE(
              json_agg(
                json_build_object('attribute_name', a.name, 'value', av.value)
                ORDER BY a.name
              ) FILTER (WHERE oio.attribute_value_id IS NOT NULL),
              '[]'
            ) as options
     FROM kitchen_ticket_items kti
     JOIN order_items oi ON kti.order_item_id = oi.id
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
     LEFT JOIN attribute_values av ON oio.attribute_value_id = av.id
     LEFT JOIN attributes a ON av.attribute_id = a.id
     WHERE kti.ticket_id = ANY($1::int[])
     GROUP BY kti.id, kti.ticket_id, kti.status, oi.quantity, p.name
     ORDER BY kti.id`,
    [ticketIds]
  );

  // Group items by ticket_id
  const itemsByTicket = {};
  itemsResult.rows.forEach(item => {
    if (!itemsByTicket[item.ticket_id]) itemsByTicket[item.ticket_id] = [];
    itemsByTicket[item.ticket_id].push(item);
  });

  return tickets.map(ticket => ({
    ...ticket,
    items: itemsByTicket[ticket.id] || [],
  }));
};

const getKitchenTicketById = async (ticketId) => {
  const ticketResult = await query(
    `SELECT kt.*,
            o.order_number,
            o.created_at as order_created_at,
            t.table_number,
            f.name as floor_name
     FROM kitchen_tickets kt
     JOIN orders o ON kt.order_id = o.id
     LEFT JOIN tables t ON o.table_id = t.id
     LEFT JOIN floors f ON t.floor_id = f.id
     WHERE kt.id = $1`,
    [ticketId]
  );

  if (ticketResult.rows.length === 0) {
    throw { status: 404, message: 'Kitchen ticket not found' };
  }

  const ticket = ticketResult.rows[0];

  const itemsResult = await query(
    `SELECT kti.*,
            oi.quantity,
            p.name as product_name,
            COALESCE(
              json_agg(
                json_build_object(
                  'attribute_name', a.name,
                  'value', av.value
                ) ORDER BY a.name
              ) FILTER (WHERE oio.attribute_value_id IS NOT NULL),
              '[]'
            ) as options
     FROM kitchen_ticket_items kti
     JOIN order_items oi ON kti.order_item_id = oi.id
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN order_item_options oio ON oi.id = oio.order_item_id
     LEFT JOIN attribute_values av ON oio.attribute_value_id = av.id
     LEFT JOIN attributes a ON av.attribute_id = a.id
     WHERE kti.ticket_id = $1
     GROUP BY kti.id, oi.quantity, p.name
     ORDER BY kti.id`,
    [ticketId]
  );

  ticket.items = itemsResult.rows;
  return ticket;
};

const updateTicketStatus = async (ticketId, newStatus, app) => {
  const ticketCheck = await query(
    'SELECT id, status, order_id FROM kitchen_tickets WHERE id = $1',
    [ticketId]
  );

  if (ticketCheck.rows.length === 0) {
    throw { status: 404, message: 'Kitchen ticket not found' };
  }

  const currentStatus = ticketCheck.rows[0].status;
  const orderId = ticketCheck.rows[0].order_id;
  const validTransitions = {
    'TO_COOK': ['PREPARING'],
    'PREPARING': ['COMPLETED'],
    'COMPLETED': [],
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw { status: 400, message: `Invalid status transition from ${currentStatus} to ${newStatus}` };
  }

  await query(
    `UPDATE kitchen_ticket_items SET status = $1 WHERE ticket_id = $2`,
    [newStatus, ticketId]
  );

  await query(
    'UPDATE kitchen_tickets SET status = $1 WHERE id = $2',
    [newStatus, ticketId]
  );

  // Emit Socket.IO events
  if (app) {
    const io = app.get('io');
    if (io) {
      io.to('kitchen').emit('order_updated', {
        ticket_id: ticketId,
        order_id: orderId,
        status: newStatus,
      });
      io.to('customer_display').emit('order_status_changed', {
        order_id: orderId,
        status: newStatus,
      });
    }
  }

  return { message: 'Ticket status updated successfully' };
};

const updateTicketItemStatus = async (ticketId, itemId, newStatus, app) => {
  const itemCheck = await query(
    'SELECT id, status FROM kitchen_ticket_items WHERE id = $1 AND ticket_id = $2',
    [itemId, ticketId]
  );

  if (itemCheck.rows.length === 0) {
    throw { status: 404, message: 'Kitchen ticket item not found' };
  }

  const currentStatus = itemCheck.rows[0].status;
  const validTransitions = {
    'TO_COOK': ['PREPARING'],
    'PREPARING': ['COMPLETED'],
    'COMPLETED': [],
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw { status: 400, message: `Invalid status transition from ${currentStatus} to ${newStatus}` };
  }

  await query(
    'UPDATE kitchen_ticket_items SET status = $1 WHERE id = $2',
    [newStatus, itemId]
  );

  const remainingItemsResult = await query(
    `SELECT COUNT(*) as total,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed
     FROM kitchen_ticket_items
     WHERE ticket_id = $1`,
    [ticketId]
  );

  const { total, completed } = remainingItemsResult.rows[0];
  let ticketAutoCompleted = false;

  if (parseInt(total) === parseInt(completed)) {
    await query(
      'UPDATE kitchen_tickets SET status = $1 WHERE id = $2',
      ['COMPLETED', ticketId]
    );
    ticketAutoCompleted = true;
  }

  // Emit Socket.IO event
  if (app) {
    const io = app.get('io');
    if (io) {
      const ticketRes = await query('SELECT order_id FROM kitchen_tickets WHERE id = $1', [ticketId]);
      const orderId = ticketRes.rows[0]?.order_id;
      io.to('kitchen').emit('order_updated', {
        ticket_id: parseInt(ticketId),
        item_id: parseInt(itemId),
        item_status: newStatus,
        ticket_completed: ticketAutoCompleted,
        order_id: orderId,
      });
    }
  }

  return { message: 'Ticket item status updated successfully' };
};

module.exports = {
  listKitchenTickets,
  getKitchenTicketById,
  updateTicketStatus,
  updateTicketItemStatus,
};
