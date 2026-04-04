const z = require('zod');

const createFloorSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Floor name is required').max(100),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const getFloorSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const updateFloorSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Floor name is required').max(100),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const deleteFloorSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createFloorSchema,
  getFloorSchema,
  updateFloorSchema,
  deleteFloorSchema,
};
