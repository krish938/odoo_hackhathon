const z = require('zod');

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(100),
    send_to_kitchen: z.boolean().optional().default(false),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    send_to_kitchen: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const getCategorySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  getCategorySchema,
};
