const {
  createTable,
  listAllTables,
  getTableById,
  listTablesByFloor,
  updateTable,
  deleteTable,
} = require('./tables.service');

const createTableController = async (req, res, next) => {
  try {
    const table = await createTable(req.body);
    res.status(201).json(table);
  } catch (error) {
    next(error);
  }
};

const listAllTablesController = async (req, res, next) => {
  try {
    const tables = await listAllTables();
    res.json(tables);
  } catch (error) {
    next(error);
  }
};

const getTableController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const table = await getTableById(id);
    res.json(table);
  } catch (error) {
    next(error);
  }
};

const listTablesByFloorController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tables = await listTablesByFloor(id);
    res.json(tables);
  } catch (error) {
    next(error);
  }
};

const updateTableController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const table = await updateTable(id, req.body);
    res.json(table);
  } catch (error) {
    next(error);
  }
};

const deleteTableController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteTable(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTableController,
  listAllTablesController,
  getTableController,
  listTablesByFloorController,
  updateTableController,
  deleteTableController,
};
