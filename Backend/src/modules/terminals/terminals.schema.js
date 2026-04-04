const z = require('zod');

const createTerminalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Terminal name is required').max(100),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const getTerminalSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createTerminalSchema,
  getTerminalSchema,
};
