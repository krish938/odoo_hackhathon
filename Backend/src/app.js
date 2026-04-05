const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const productsRoutes = require('./modules/products/products.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const attributesRoutes = require('./modules/attributes/attributes.routes');
const paymentMethodsRoutes = require('./modules/paymentMethods/paymentMethods.routes');
const floorsRoutes = require('./modules/floors/floors.routes');
const { tablesRouter, tablesByFloorRouter } = require('./modules/tables/tables.routes');
const usersRoutes = require('./modules/users/users.routes');
const terminalsRoutes = require('./modules/terminals/terminals.routes');
const sessionsRoutes = require('./modules/sessions/sessions.routes');
const customerRoutes = require('./modules/customers/customers.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const kitchenRoutes = require('./modules/kitchen/kitchen.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const selfOrderRoutes = require('./modules/selfOrder/selfOrder.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');
const requestId = require('./middlewares/requestId');

const app = express();

// Security middleware
app.use(helmet());

// Gzip compression for all responses (critical for 3G/slow connections)
app.use(compression());

// Configure CORS properly
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // Allow all for dev; tighten in prod
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Increased for local development testing
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for local development testing
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID for tracing
app.use(requestId);

// Request logging
app.use((req, res, next) => {
  logger.info({ requestId: req.id, method: req.method, path: req.path }, 'Incoming request');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Odoo POS Cafe API',
      version: '1.0.0',
    },
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/attributes', attributesRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/floors', floorsRoutes);
app.use('/api/tables', tablesRouter);
app.use('/api/users', usersRoutes);
app.use('/api/terminals', terminalsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/self-order', selfOrderRoutes);
app.use('/api/reports', reportsRoutes);

app.use('/api/floors/:id/tables', tablesByFloorRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} is not a valid route`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
