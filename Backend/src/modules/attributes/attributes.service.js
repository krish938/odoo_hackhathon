const { query } = require('../../config/db');

const createAttribute = async (name) => {
  const result = await query(
    'INSERT INTO attributes (name) VALUES ($1) RETURNING *',
    [name]
  );

  return result.rows[0];
};

const listAttributes = async () => {
  const result = await query(
    `SELECT a.*, 
            COALESCE(
              json_agg(
                json_build_object(
                  'id', av.id,
                  'value', av.value,
                  'extra_price', av.extra_price
                ) ORDER BY av.value
              ) FILTER (WHERE av.id IS NOT NULL), 
              '[]'
            ) as values
     FROM attributes a
     LEFT JOIN attribute_values av ON a.id = av.attribute_id
     GROUP BY a.id
     ORDER BY a.name`
  );

  return result.rows;
};

const createAttributeValue = async (attributeId, value, extra_price = 0) => {
  const attributeCheck = await query(
    'SELECT id FROM attributes WHERE id = $1',
    [attributeId]
  );

  if (attributeCheck.rows.length === 0) {
    throw { status: 404, message: 'Attribute not found' };
  }

  const result = await query(
    'INSERT INTO attribute_values (attribute_id, value, extra_price) VALUES ($1, $2, $3) RETURNING *',
    [attributeId, value, extra_price]
  );

  return result.rows[0];
};

const deleteAttributeValue = async (attributeId, valueId) => {
  const checkResult = await query(
    'SELECT av.id FROM attribute_values av WHERE av.id = $1 AND av.attribute_id = $2',
    [valueId, attributeId]
  );

  if (checkResult.rows.length === 0) {
    throw { status: 404, message: 'Attribute value not found' };
  }

  const usageCheck = await query(
    'SELECT COUNT(*) as count FROM order_item_options WHERE attribute_value_id = $1',
    [valueId]
  );

  if (parseInt(usageCheck.rows[0].count) > 0) {
    throw { status: 400, message: 'Cannot delete attribute value that is in use' };
  }

  await query('DELETE FROM attribute_values WHERE id = $1', [valueId]);

  return { message: 'Attribute value deleted successfully' };
};

module.exports = {
  createAttribute,
  listAttributes,
  createAttributeValue,
  deleteAttributeValue,
};
