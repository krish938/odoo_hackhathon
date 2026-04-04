const z = require('zod');

const createTokenSchema = z.object({
  body: z.object({
    table_id: z.number().int().positive('Table ID must be positive'),
    session_id: z.number().int().positive('Session ID must be positive'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const getMenuSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    token: z.string().min(16, 'Token must be at least 16 characters'),
  }),
});

const createSelfOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().positive(),
      attribute_value_ids: z.array(z.number().int().positive()).optional(),
    })).min(1, 'At least one item is required'),
  }),
  params: z.object({}).optional(),
  query: z.object({
    token: z.string().min(16, 'Token must be at least 16 characters'),
  }),
});

module.exports = {
  createTokenSchema,
  getMenuSchema,
  createSelfOrderSchema,
};
