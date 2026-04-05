/**
 * Seed 500 users into the database using a single bulk INSERT for maximum speed.
 * All passwords are bcrypt hash of "Staff@1234".
 * Run: node seed_500_users.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/pos',
});

const TOTAL = 500;
const PASSWORD = 'Staff@1234';
const ROLES = ['staff', 'staff', 'staff', 'manager']; // 75% staff, 25% manager

const firstNames = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
  'Shaurya','Atharv','Advik','Pranav','Advaith','Aarush','Kabir','Ritvik','Anirudh','Dhruv',
  'Ananya','Diya','Myra','Sara','Aanya','Aadhya','Aaradhya','Anvi','Prisha','Riya',
  'Aisha','Navya','Pari','Shreya','Saanvi','Kavya','Ira','Ahana','Kiara','Meera',
  'Rohan','Karan','Manav','Yash','Dev','Neil','Raj','Vikram','Amit','Nikhil',
];

const lastNames = [
  'Sharma','Verma','Patel','Gupta','Singh','Kumar','Joshi','Reddy','Nair','Iyer',
  'Rao','Pillai','Mehta','Shah','Kapoor','Malhotra','Jain','Chopra','Bose','Das',
  'Banerjee','Mukherjee','Sen','Dutta','Mishra','Pandey','Tiwari','Saxena','Aggarwal','Bhatia',
];

const departments = ['kitchen','service','bar','cashier','delivery','host','cleaning','management'];

async function main() {
  console.time('seed_500_users');

  // Hash password once and reuse for all 500 users — massive speed win
  const hash = await bcrypt.hash(PASSWORD, 12);

  // Build a single massive VALUES clause
  const values = [];
  const params = [];
  const usedEmails = new Set();

  for (let i = 1; i <= TOTAL; i++) {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
    const name = `${first} ${last}`;

    // Guarantee unique email
    let email;
    do {
      const suffix = Math.floor(Math.random() * 9000) + 1000;
      email = `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@pos.com`;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const offset = (i - 1) * 4;
    values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
    params.push(name, email, hash, role);
  }

  const sql = `INSERT INTO users (name, email, password_hash, role) VALUES ${values.join(',\n')} ON CONFLICT (email) DO NOTHING`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(sql, params);
    await client.query('COMMIT');
    console.log(`✅ Inserted ${res.rowCount} users successfully`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed users:', err.message);
  } finally {
    client.release();
    await pool.end();
  }

  console.timeEnd('seed_500_users');
}

main();
