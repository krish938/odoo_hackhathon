const z = require('zod');

const optionalId = z
  .string()
  .transform(Number)
  .pipe(z.number().int().positive())
  .optional();

const summaryReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      session_id: optionalId,
      user_id: optionalId,
      product_id: optionalId,
    })
    .transform((q) => ({
      from: q.from || q.from_date,
      to: q.to || q.to_date,
      session_id: q.session_id,
      user_id: q.user_id,
      product_id: q.product_id,
    })),
});

const ordersReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
      from_date: z.string().optional(),
      to_date: z.string().optional(),
      session_id: optionalId,
      user_id: optionalId,
      product_id: optionalId,
      page: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive())
        .optional(),
      limit: z
        .string()
        .transform(Number)
        .pipe(z.number().int().positive().max(100))
        .optional(),
    })
    .transform((q) => ({
      from: q.from || q.from_date,
      to: q.to || q.to_date,
      session_id: q.session_id,
      user_id: q.user_id,
      product_id: q.product_id,
      page: q.page ?? 1,
      limit: q.limit ?? 20,
    })),
});

module.exports = {
  summaryReportSchema,
  ordersReportSchema,
};
