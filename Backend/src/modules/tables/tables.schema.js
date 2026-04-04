const z = require('zod');

const createTableSchema = z.object({
  body: z.object({
    floor_id: z.number().int().positive('Floor ID must be positive'),
    table_number: z.string().min(1, 'Table number is required').max(50),
    seats: z.number().int().positive('Seats must be positive'),
    appointment_resource: z.string().max(100).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateTableSchema = z.object({
  body: z.object({
    floor_id: z.number().int().positive().optional(),
    table_number: z.string().min(1).max(50).optional(),
    seats: z.number().int().positive().optional(),
    appointment_resource: z.string().max(100).optional(),
    is_active: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const deleteTableSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const getTableSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createTableSchema,
  updateTableSchema,
  deleteTableSchema,
  getTableSchema,
};
