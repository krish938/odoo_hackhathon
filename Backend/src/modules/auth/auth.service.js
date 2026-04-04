const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const { query } = require('../../config/db');

const signup = async (name, email, password, role = 'staff') => {
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 AND is_deleted = false',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw { status: 409, message: 'Email already registered' };
  }

  const passwordHash = await bcrypt.hash(password, parseInt(env.BCRYPT_ROUNDS));

  const result = await query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
    [name, email, passwordHash, role]
  );

  const user = result.rows[0];
  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, user };
};

const login = async (email, password) => {
  const result = await query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = $1 AND is_deleted = false',
    [email]
  );

  if (result.rows.length === 0) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const { password_hash, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

module.exports = { signup, login };
