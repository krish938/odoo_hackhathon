const z = require('zod');

const createAttributeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Attribute name is required').max(100),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const createAttributeValueSchema = z.object({
  body: z.object({
    value: z.string().min(1, 'Attribute value is required').max(100),
    extra_price: z.number().min(0).optional().default(0),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const deleteAttributeValueSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
    valueId: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createAttributeSchema,
  createAttributeValueSchema,
  deleteAttributeValueSchema,
};
