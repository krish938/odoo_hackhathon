const { query } = require('../../config/db');

const createTable = async (tableData) => {
  const { floor_id, table_number, seats, appointment_resource } = tableData;

  const floorCheck = await query('SELECT id FROM floors WHERE id = $1', [floor_id]);
  if (floorCheck.rows.length === 0) {
    throw { status: 400, message: 'Floor not found' };
  }

  const duplicateCheck = await query(
    'SELECT id FROM tables WHERE floor_id = $1 AND table_number = $2',
    [floor_id, table_number]
  );

  if (duplicateCheck.rows.length > 0) {
    throw { status: 409, message: 'Table number already exists on this floor' };
  }

  const result = await query(
    'INSERT INTO tables (floor_id, table_number, seats, appointment_resource) VALUES ($1, $2, $3, $4) RETURNING *',
    [floor_id, table_number, seats, appointment_resource || null]
  );

  return result.rows[0];
};

const listAllTables = async () => {
  const result = await query(
    `SELECT t.*, f.name as floor_name,
            COUNT(o.id) as order_count
     FROM tables t
     JOIN floors f ON t.floor_id = f.id
     LEFT JOIN orders o ON t.id = o.table_id AND o.status != 'PAID'
     GROUP BY t.id, f.name
     ORDER BY f.name, t.table_number`
  );

  return result.rows;
};

const getTableById = async (id) => {
  const result = await query(
    `SELECT t.*, f.name as floor_name
     FROM tables t
     JOIN floors f ON t.floor_id = f.id
     WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Table not found' };
  }

  return result.rows[0];
};

const listTablesByFloor = async (floorId) => {
  const result = await query(
    `SELECT t.*, f.name as floor_name,
            COUNT(o.id) as order_count
     FROM tables t
     JOIN floors f ON t.floor_id = f.id
     LEFT JOIN orders o ON t.id = o.table_id AND o.status != 'PAID'
     WHERE t.floor_id = $1
     GROUP BY t.id, f.name
     ORDER BY t.table_number`,
    [floorId]
  );

  return result.rows;
};

const updateTable = async (id, updateData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updateData.floor_id) {
    const floorCheck = await query('SELECT id FROM floors WHERE id = $1', [updateData.floor_id]);
    if (floorCheck.rows.length === 0) {
      throw { status: 400, message: 'Floor not found' };
    }
  }

  if (updateData.floor_id && updateData.table_number) {
    const duplicateCheck = await query(
      'SELECT id FROM tables WHERE floor_id = $1 AND table_number = $2 AND id != $3',
      [updateData.floor_id, updateData.table_number, id]
    );

    if (duplicateCheck.rows.length > 0) {
      throw { status: 409, message: 'Table number already exists on this floor' };
    }
  }

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
    `UPDATE tables SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Table not found' };
  }

  return result.rows[0];
};

const deleteTable = async (id) => {
  const orderCheck = await query(
    'SELECT COUNT(*) as count FROM orders WHERE table_id = $1 AND status NOT IN (\'COMPLETED\', \'PAID\')',
    [id]
  );

  if (parseInt(orderCheck.rows[0].count) > 0) {
    throw { status: 400, message: 'Cannot delete table with active orders' };
  }

  const result = await query('DELETE FROM tables WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Table not found' };
  }

  return { message: 'Table deleted successfully' };
};

module.exports = {
  createTable,
  listAllTables,
  getTableById,
  listTablesByFloor,
  updateTable,
  deleteTable,
};
