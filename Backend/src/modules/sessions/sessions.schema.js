const z = require('zod');

const openSessionSchema = z.object({
  body: z.object({
    terminal_id: z.number().int().positive('Terminal ID must be positive'),
    opening_balance: z.number().min(0, 'Opening balance must be non-negative'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const closeSessionSchema = z.object({
  body: z
    .object({
      closing_balance: z.coerce.number().min(0, 'Closing balance must be non-negative').optional(),
    })
    .optional()
    .default({}),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const getSessionSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  openSessionSchema,
  closeSessionSchema,
  getSessionSchema,
};
