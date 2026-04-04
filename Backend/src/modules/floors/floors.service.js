const { query } = require('../../config/db');

const createFloor = async (name) => {
  const result = await query(
    'INSERT INTO floors (name) VALUES ($1) RETURNING *',
    [name]
  );

  return result.rows[0];
};

const listFloors = async () => {
  const result = await query(
    `SELECT f.*, 
            COUNT(t.id) as total_tables,
            COUNT(CASE WHEN t.is_active = true THEN 1 END) as active_tables
     FROM floors f
     LEFT JOIN tables t ON f.id = t.floor_id
     GROUP BY f.id
     ORDER BY f.name`
  );

  return result.rows;
};

const getFloorById = async (id) => {
  const result = await query('SELECT * FROM floors WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Floor not found' };
  }

  return result.rows[0];
};

const updateFloor = async (id, name) => {
  const result = await query(
    'UPDATE floors SET name = $1 WHERE id = $2 RETURNING *',
    [name, id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Floor not found' };
  }

  return result.rows[0];
};

const deleteFloor = async (id) => {
  const tablesCheck = await query(
    'SELECT COUNT(*)::int AS count FROM tables WHERE floor_id = $1',
    [id]
  );

  if (tablesCheck.rows[0].count > 0) {
    throw {
      status: 400,
      message: 'Cannot delete floor that still has tables. Remove or reassign tables first.',
    };
  }

  const result = await query('DELETE FROM floors WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Floor not found' };
  }

  return { message: 'Floor deleted successfully' };
};

module.exports = {
  createFloor,
  listFloors,
  getFloorById,
  updateFloor,
  deleteFloor,
};
