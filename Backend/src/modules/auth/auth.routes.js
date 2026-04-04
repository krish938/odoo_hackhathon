const express = require('express');
const { signupController, loginController, logoutController } = require('./auth.controller');
const { signupSchema, loginSchema } = require('./auth.schema');
const validate = require('../../middlewares/validate');

const router = express.Router();

// Authentication routes - no auth middleware required
router.post('/signup', validate(signupSchema), signupController);
router.post('/login', validate(loginSchema), loginController);
router.post('/logout', logoutController);

module.exports = router;
