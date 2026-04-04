const app = require('./app');
const { env } = require('./config/env');

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Odoo POS Cafe API Server running on port ${env.PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${env.PORT}/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n❌ Port ${env.PORT} is already in use (another backend or app is using it).\n\n` +
        `Fix on Windows:\n` +
        `  1) Find PID:  netstat -ano | findstr :${env.PORT}\n` +
        `  2) Stop it:   taskkill /PID <number> /F\n\n` +
        `Or use a different port: set PORT=3002 in Backend/.env and\n` +
        `VITE_API_URL=http://localhost:3002 in frontend/.env\n`
    );
  } else {
    console.error('Server failed to start:', err);
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = server;
