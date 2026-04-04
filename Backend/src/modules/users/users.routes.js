const express = require('express');
const { listUsersController } = require('./users.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth');

const router = express.Router();

router.use(verifyToken);
router.get('/', requireRole(['admin', 'manager']), listUsersController);

module.exports = router;
