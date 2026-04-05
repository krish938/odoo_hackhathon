const z = require('zod');

const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.string().trim().toLowerCase().email('Valid email required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return 'staff';
        return val;
      },
      z.enum(['admin', 'staff'], {
        errorMap: () => ({ message: 'Role must be admin or staff' }),
      })
    ),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(1, 'Password is required'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = { signupSchema, loginSchema };
