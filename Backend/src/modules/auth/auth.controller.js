const { signup, login } = require('./auth.service');

const signupController = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await signup(name, email, password, role);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const logoutController = async (req, res) => {
  res.status(204).send();
};

module.exports = { signupController, loginController, logoutController };
