const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { env } = require('./config/env');
const logger = require('./config/logger');

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: env.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Attach io to app so controllers can access it
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Socket.IO client connected');

  socket.on('join_kitchen', () => {
    socket.join('kitchen');
    logger.info({ socketId: socket.id }, 'Client joined kitchen room');
    socket.emit('joined', { room: 'kitchen' });
  });

  socket.on('join_customer_display', (data) => {
    const room = data?.table_id ? `customer_display_${data.table_id}` : 'customer_display';
    socket.join(room);
    socket.join('customer_display'); // Always join the global room too
    logger.info({ socketId: socket.id, room }, 'Client joined customer display room');
    socket.emit('joined', { room });
  });

  socket.on('disconnect', (reason) => {
    logger.info({ socketId: socket.id, reason }, 'Socket.IO client disconnected');
  });
});

// Start server
server.listen(env.PORT, () => {
  logger.info(`🚀 Odoo POS Cafe API running on port ${env.PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health: http://localhost:${env.PORT}/health`);
  logger.info(`🔌 Socket.IO ready`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${env.PORT} already in use. Check for another running process.`);
  } else {
    logger.error({ err }, 'Server failed to start');
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = server;
