const z = require('zod');

const listTicketsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    status: z.enum(['TO_COOK', 'PREPARING', 'COMPLETED']).optional(),
  }),
});

const getTicketSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const updateTicketStatusSchema = z.object({
  body: z.object({
    status: z.enum(['TO_COOK', 'PREPARING', 'COMPLETED']),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const updateTicketItemStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PREPARING', 'COMPLETED']),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
    itemId: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  listTicketsSchema,
  getTicketSchema,
  updateTicketStatusSchema,
  updateTicketItemStatusSchema,
};
