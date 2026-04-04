const { query } = require('../../config/db');

const createPayment = async (paymentData) => {
  const { order_id, payment_method_id, amount, transaction_ref } = paymentData;

  const orderCheck = await query(
    'SELECT id, status, total_amount FROM orders WHERE id = $1',
    [order_id]
  );

  if (orderCheck.rows.length === 0) {
    throw { status: 404, message: 'Order not found' };
  }

  const order = orderCheck.rows[0];

  if (order.status === 'PAID') {
    throw { status: 400, message: 'Order is already paid' };
  }

  if (order.status !== 'COMPLETED') {
    throw { status: 400, message: 'Order must be completed before payment' };
  }

  const paymentMethodCheck = await query(
    'SELECT id, name FROM payment_methods WHERE id = $1 AND is_enabled = true',
    [payment_method_id]
  );

  if (paymentMethodCheck.rows.length === 0) {
    throw { status: 400, message: 'Payment method not found or disabled' };
  }

  const existingPaymentsResult = await query(
    'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE order_id = $1 AND status = $2',
    [order_id, 'SUCCESS']
  );

  const totalPaid = parseFloat(existingPaymentsResult.rows[0].total_paid);
  const orderTotal = parseFloat(order.total_amount);

  if (totalPaid + amount > orderTotal) {
    throw { status: 400, message: 'Payment amount exceeds order total' };
  }

  await query('BEGIN');

  try {
    const paymentResult = await query(
      `INSERT INTO payments (order_id, payment_method_id, amount, transaction_ref, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [order_id, payment_method_id, amount, transaction_ref || null, 'SUCCESS']
    );

    const newTotalPaid = totalPaid + amount;

    if (Math.abs(newTotalPaid - orderTotal) < 0.01) {
      await query(
        `UPDATE orders 
         SET status = 'PAID', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [order_id]
      );

      await query(
        'INSERT INTO order_logs (order_id, status) VALUES ($1, $2)',
        [order_id, 'PAID']
      );
    }

    await query('COMMIT');

    return paymentResult.rows[0];
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

const getOrderPayments = async (orderId) => {
  const orderCheck = await query('SELECT id FROM orders WHERE id = $1', [orderId]);

  if (orderCheck.rows.length === 0) {
    throw { status: 404, message: 'Order not found' };
  }

  const result = await query(
    `SELECT p.*, 
            pm.name as payment_method_name,
            pm.type as payment_method_type
     FROM payments p
     JOIN payment_methods pm ON p.payment_method_id = pm.id
     WHERE p.order_id = $1
     ORDER BY p.created_at DESC`,
    [orderId]
  );

  return result.rows;
};

module.exports = {
  createPayment,
  getOrderPayments,
};
