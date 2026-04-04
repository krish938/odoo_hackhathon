const { query } = require('../../config/db');
const cache = require('../../utils/cache');

const createProduct = async (productData) => {
  const { name, category_id, base_price, unit, tax, description, send_to_kitchen } = productData;

  const categoryCheck = await query('SELECT id FROM categories WHERE id = $1', [category_id]);
  if (categoryCheck.rows.length === 0) {
    throw { status: 400, message: 'Category not found' };
  }

  const result = await query(
    `INSERT INTO products (name, category_id, base_price, unit, tax, description, send_to_kitchen)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, category_id, base_price, unit, tax, description, send_to_kitchen, is_active, updated_at`,
    [name, category_id, base_price, unit, tax, description, send_to_kitchen]
  );

  cache.invalidate('products_list');
  return result.rows[0];
};

const getProductById = async (id) => {
  const result = await query(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Product not found' };
  }

  return result.rows[0];
};

const listProducts = async (filters = {}) => {
  const { category_id, is_active } = filters;
  const cacheKey = `products_list_${category_id || 'all'}_${is_active !== undefined ? is_active : 'all'}`;

  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (category_id) {
    whereClause += ` AND p.category_id = $${paramIndex++}`;
    params.push(category_id);
  }

  if (is_active !== undefined) {
    whereClause += ` AND p.is_active = $${paramIndex++}`;
    params.push(is_active);
  }

  const result = await query(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${whereClause}
     ORDER BY p.name`,
    params
  );

  cache.set(cacheKey, result.rows, 60000); // 1 min TTL
  return result.rows;
};

const updateProduct = async (id, updateData) => {
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

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, name, category_id, base_price, unit, tax, description, send_to_kitchen, is_active, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Product not found' };
  }

  cache.invalidate('products_list');
  return result.rows[0];
};

const softDeleteProduct = async (id) => {
  const result = await query(
    'UPDATE products SET is_active = false WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Product not found' };
  }

  cache.invalidate('products_list');
  return { message: 'Product deactivated successfully' };
};

/**
 * Get attributes applicable to a specific product via product_attribute_links.
 * Falls back to returning all attributes with values if no links exist.
 */
const getProductAttributes = async (productId) => {
  // Check if product exists
  const productCheck = await query('SELECT id FROM products WHERE id = $1', [productId]);
  if (productCheck.rows.length === 0) {
    throw { status: 404, message: 'Product not found' };
  }

  // Get linked attributes (from product_attribute_links table)
  const linkedResult = await query(
    `SELECT a.id, a.name,
            json_agg(
              json_build_object(
                'id', av.id,
                'value', av.value,
                'extra_price', av.extra_price
              ) ORDER BY av.value
            ) FILTER (WHERE av.id IS NOT NULL) as values
     FROM product_attribute_links pal
     JOIN attributes a ON pal.attribute_id = a.id
     LEFT JOIN attribute_values av ON av.attribute_id = a.id
     WHERE pal.product_id = $1
     GROUP BY a.id, a.name
     ORDER BY a.name`,
    [productId]
  );

  // If no links exist, return all attributes (for backward compatibility)
  if (linkedResult.rows.length === 0) {
    const allResult = await query(
      `SELECT a.id, a.name,
              json_agg(
                json_build_object(
                  'id', av.id,
                  'value', av.value,
                  'extra_price', av.extra_price
                ) ORDER BY av.value
              ) FILTER (WHERE av.id IS NOT NULL) as values
       FROM attributes a
       LEFT JOIN attribute_values av ON av.attribute_id = a.id
       GROUP BY a.id, a.name
       ORDER BY a.name`
    );
    return allResult.rows;
  }

  return linkedResult.rows;
};

module.exports = {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  softDeleteProduct,
  getProductAttributes,
};
