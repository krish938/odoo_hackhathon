const {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  softDeleteProduct,
  getProductAttributes,
} = require('./products.service');

const createProductController = async (req, res, next) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const getProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const listProductsController = async (req, res, next) => {
  try {
    const products = await listProducts(req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const updateProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await updateProduct(id, req.body);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const deleteProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await softDeleteProduct(id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getProductAttributesController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attributes = await getProductAttributes(id);
    res.json({ success: true, data: attributes });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProductController,
  getProductController,
  listProductsController,
  updateProductController,
  deleteProductController,
  getProductAttributesController,
};
