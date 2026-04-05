const express = require('express');
const router = express.Router();
const customersController = require('./customers.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth');

router.use(verifyToken);

router.get('/', customersController.listCustomers);
router.post('/', requireRole(['admin', 'manager', 'staff']), customersController.createCustomer);
router.get('/:id', customersController.getCustomer);

module.exports = router;
