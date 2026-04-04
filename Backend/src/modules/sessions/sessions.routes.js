const express = require('express');
const {
  openSessionController,
  closeSessionController,
  listSessionsController,
  getSessionController,
} = require('./sessions.controller');
const {
  openSessionSchema,
  closeSessionSchema,
  getSessionSchema,
} = require('./sessions.schema');
const { verifyToken } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

router.use(verifyToken);

router.post('/open', validate(openSessionSchema), openSessionController);
router.get('/', listSessionsController);
router.post('/:id/close', validate(closeSessionSchema), closeSessionController);
router.get('/:id', validate(getSessionSchema), getSessionController);

module.exports = router;
