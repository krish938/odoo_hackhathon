const pool = require('./src/config/db.js');

async function run() {
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);');
    await pool.query('ALTER TABLE pos_terminals ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);');
    console.log('Database changes applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
