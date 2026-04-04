const {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  softDeleteProduct,
} = require('./products.service');

const createProductController = async (req, res, next) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const getProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const listProductsController = async (req, res, next) => {
  try {
    const products = await listProducts(req.query);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

const updateProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await updateProduct(id, req.body);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await softDeleteProduct(id);
    res.json(result);
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
};
