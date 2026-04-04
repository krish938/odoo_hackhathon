const z = require('zod');

const UPI_REGEX = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;

const createPaymentMethodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Payment method name is required').max(50),
    type: z.enum(['CASH', 'DIGITAL', 'UPI']),
    upi_id: z.string().regex(UPI_REGEX, 'Invalid UPI ID format (e.g. example@upi)').max(100).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updatePaymentMethodSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    type: z.enum(['CASH', 'DIGITAL', 'UPI']).optional(),
    is_enabled: z.boolean().optional(),
    upi_id: z.string().regex(UPI_REGEX, 'Invalid UPI ID format').max(100).optional(),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const deletePaymentMethodSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  deletePaymentMethodSchema,
};
