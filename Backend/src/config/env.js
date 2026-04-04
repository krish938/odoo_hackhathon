require('dotenv').config();
const z = require('zod');

const envSchema = z.object({
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
});

const env = envSchema.parse(process.env);

module.exports = { env };
