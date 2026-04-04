const {
  createCategory,
  getCategoryById,
  listCategories,
  updateCategory,
  deleteCategory,
} = require('./categories.service');

const createCategoryController = async (req, res, next) => {
  try {
    const category = await createCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const getCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const listCategoriesController = async (req, res, next) => {
  try {
    const categories = await listCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const updateCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await updateCategory(id, req.body);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteCategory(id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategoryController,
  getCategoryController,
  listCategoriesController,
  updateCategoryController,
  deleteCategoryController,
};
