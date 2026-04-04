const {
  createAttribute,
  listAttributes,
  createAttributeValue,
  deleteAttributeValue,
} = require('./attributes.service');

const createAttributeController = async (req, res, next) => {
  try {
    const { name } = req.body;
    const attribute = await createAttribute(name);
    res.status(201).json({ success: true, data: attribute });
  } catch (error) {
    next(error);
  }
};

const listAttributesController = async (req, res, next) => {
  try {
    const attributes = await listAttributes();
    res.json({ success: true, data: attributes });
  } catch (error) {
    next(error);
  }
};

const createAttributeValueController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { value, extra_price } = req.body;
    const attributeValue = await createAttributeValue(id, value, extra_price);
    res.status(201).json({ success: true, data: attributeValue });
  } catch (error) {
    next(error);
  }
};

const deleteAttributeValueController = async (req, res, next) => {
  try {
    const { id, valueId } = req.params;
    const result = await deleteAttributeValue(id, valueId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAttributeController,
  listAttributesController,
  createAttributeValueController,
  deleteAttributeValueController,
};
