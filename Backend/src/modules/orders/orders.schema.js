const z = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    session_id: z.number().int().positive('Session ID must be positive'),
    table_id: z.number().int().positive('Table ID must be positive').optional(),
    source: z.enum(['POS', 'SELF']).optional().default('POS'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const addOrderItemSchema = z.object({
  body: z.object({
    product_id: z.number().int().positive('Product ID must be positive'),
    quantity: z.number().int().positive('Quantity must be positive'),
    attribute_value_ids: z.array(z.number().int().positive()).optional(),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const updateOrderItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be positive'),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
    itemId: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const deleteOrderItemSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
    itemId: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['CREATED', 'IN_PROGRESS', 'COMPLETED', 'PAID']),
  }),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const getOrderSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

const listOrdersSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    session_id: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    table_id: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    status: z.string().optional(),
    source: z.enum(['POS', 'SELF']).optional(),
  }),
});

const sendToKitchenSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().transform(Number).pipe(z.number().int().positive()),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createOrderSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  deleteOrderItemSchema,
  updateOrderStatusSchema,
  getOrderSchema,
  listOrdersSchema,
  sendToKitchenSchema,
};
