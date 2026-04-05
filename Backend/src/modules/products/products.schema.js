const z = require('zod');

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(150),
    category_id: z.coerce.number().int().positive('Category ID must be positive'),
    base_price: z.coerce.number().positive('Base price must be positive'),
    unit: z.string().max(50).optional(),
    tax: z.coerce.number().min(0).max(100).optional(),
    description: z.string().optional(),
    send_to_kitchen: z.coerce.boolean().optional().default(false),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    category_id: z.coerce.number().int().positive().optional(),
    base_price: z.coerce.number().positive().optional(),
    unit: z.string().max(50).optional(),
    tax: z.coerce.number().min(0).max(100).optional(),
    description: z.string().optional(),
    send_to_kitchen: z.coerce.boolean().optional(),
    is_active: z.coerce.boolean().optional(),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const getProductSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const listProductsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    category_id: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    is_active: z.string().transform(val => val === 'true').optional(),
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  listProductsSchema,
};
