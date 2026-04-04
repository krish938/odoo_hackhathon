const { query } = require('../../config/db');

const createCategory = async (categoryData) => {
  const { name, send_to_kitchen } = categoryData;

  const result = await query(
    'INSERT INTO categories (name, send_to_kitchen) VALUES ($1, $2) RETURNING *',
    [name, send_to_kitchen]
  );

  return result.rows[0];
};

const getCategoryById = async (id) => {
  const result = await query('SELECT * FROM categories WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Category not found' };
  }

  return result.rows[0];
};

const listCategories = async () => {
  const result = await query(
    'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true GROUP BY c.id ORDER BY c.name'
  );

  return result.rows;
};

const updateCategory = async (id, updateData) => {
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
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Category not found' };
  }

  return result.rows[0];
};

const deleteCategory = async (id) => {
  const productCheck = await query(
    'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND is_active = true',
    [id]
  );

  if (parseInt(productCheck.rows[0].count) > 0) {
    throw { status: 400, message: 'Cannot delete category with active products' };
  }

  const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw { status: 404, message: 'Category not found' };
  }

  return { message: 'Category deleted successfully' };
};

module.exports = {
  createCategory,
  getCategoryById,
  listCategories,
  updateCategory,
  deleteCategory,
};
