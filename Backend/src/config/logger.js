const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

let transport;
if (isDev) {
  try {
    // pino-pretty as a transport worker (pino v8+ style)
    transport = pino.transport({
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
    });
  } catch (e) {
    transport = undefined;
  }
}

const logger = transport
  ? pino({ level: 'debug', base: { service: 'odoo-pos-cafe' } }, transport)
  : pino({ level: isDev ? 'debug' : 'info', base: { service: 'odoo-pos-cafe' } });

module.exports = logger;
