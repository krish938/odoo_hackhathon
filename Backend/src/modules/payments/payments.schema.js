const z = require('zod');

const createPaymentSchema = z.object({
  body: z.object({
    order_id: z.number().int().positive('Order ID must be positive'),
    payment_method_id: z.number().int().positive('Payment method ID must be positive'),
    amount: z.number().positive('Amount must be positive'),
    transaction_ref: z.string().max(150).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const getOrderPaymentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    orderId: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createPaymentSchema,
  getOrderPaymentsSchema,
};
