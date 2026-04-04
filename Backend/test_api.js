const bcrypt = require('bcrypt');
const { Client } = require('pg');
const http = require('http');

async function fixAndTest() {
  const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/pos' });
  try {
    await client.connect();
    const hash = await bcrypt.hash('Admin@1234', 12);
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'admin@pos.com']);
    console.log('Password updated');
    await client.end();
    
    // Now test API
    const res = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@pos.com', password: 'Admin@1234' })
    });
    const data = await res.json();
    console.log('Login Response:', data);

    if (data.token) {
      const catRes = await fetch('http://localhost:3002/api/categories', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      console.log('Categories Response:', await catRes.json());
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

fixAndTest();
