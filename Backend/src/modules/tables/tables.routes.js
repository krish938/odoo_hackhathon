const express = require('express');
const {
  createTableController,
  listAllTablesController,
  getTableController,
  listTablesByFloorController,
  updateTableController,
  deleteTableController,
} = require('./tables.controller');
const {
  createTableSchema,
  updateTableSchema,
  deleteTableSchema,
  getTableSchema,
} = require('./tables.schema');
const { verifyToken, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const tablesRouter = express.Router();
const tablesByFloorRouter = express.Router({ mergeParams: true });

tablesRouter.use(verifyToken);

tablesRouter.get('/', listAllTablesController);
tablesRouter.get('/:id', validate(getTableSchema), getTableController);
tablesRouter.post(
  '/',
  requireRole(['admin']),
  validate(createTableSchema),
  createTableController
);
tablesRouter.put(
  '/:id',
  requireRole(['admin']),
  validate(updateTableSchema),
  updateTableController
);
tablesRouter.delete(
  '/:id',
  requireRole(['admin']),
  validate(deleteTableSchema),
  deleteTableController
);

tablesByFloorRouter.use(verifyToken);
tablesByFloorRouter.get('/', listTablesByFloorController);

module.exports = { tablesRouter, tablesByFloorRouter };

