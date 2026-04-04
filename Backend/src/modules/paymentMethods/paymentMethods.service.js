const { query } = require('../../config/db');

const createPaymentMethod = async (paymentMethodData) => {
  const { name, type, upi_id } = paymentMethodData;

  if (type === 'UPI' && !upi_id) {
    throw { status: 400, message: 'UPI ID is required for UPI payment method' };
  }

  const result = await query(
    'INSERT INTO payment_methods (name, type, upi_id) VALUES ($1, $2, $3) RETURNING *',
    [name, type, upi_id || null]
  );

  return result.rows[0];
};

const listPaymentMethods = async () => {
  const result = await query(
    `SELECT pm.*, 
            COALESCE(SUM(p.amount), 0) as total_revenue,
            COUNT(p.id) as transaction_count
     FROM payment_methods pm
     LEFT JOIN payments p ON pm.id = p.payment_method_id AND p.status = 'SUCCESS'
     GROUP BY pm.id
     ORDER BY pm.name`
  );

  return result.rows;
};

const updatePaymentMethod = async (id, updateData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(updateData[key]);
    }
  });

  if (fields.length === 0) {
    throw { status: 400, message: 'No fields to update' };
  }

  values.push(id);

  const result = await query(
    `UPDATE payment_methods SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Payment method not found' };
  }

  return result.rows[0];
};

const deletePaymentMethod = async (id) => {
  const usageCheck = await query(
    'SELECT COUNT(*) as count FROM payments WHERE payment_method_id = $1',
    [id]
  );

  if (parseInt(usageCheck.rows[0].count) > 0) {
    throw { status: 400, message: 'Cannot delete payment method with transaction history' };
  }

  const result = await query('DELETE FROM payment_methods WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Payment method not found' };
  }

  return { message: 'Payment method deleted successfully' };
};

module.exports = {
  createPaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
};
