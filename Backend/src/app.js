const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { env } = require('./config/env');

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
const ordersRoutes = require('./modules/orders/orders.routes');
const kitchenRoutes = require('./modules/kitchen/kitchen.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const selfOrderRoutes = require('./modules/selfOrder/selfOrder.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Odoo POS Cafe API',
    version: '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/attributes', attributesRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/floors', floorsRoutes);
app.use('/api/tables', tablesRouter);
app.use('/api/users', usersRoutes);
app.use('/api/terminals', terminalsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/self-order', selfOrderRoutes);
app.use('/api/reports', reportsRoutes);

app.use('/api/floors/:id/tables', tablesByFloorRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
