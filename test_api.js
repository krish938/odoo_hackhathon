const http = require('http');

async function testApi() {
  try {
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
    console.error('Test Error:', err);
  }
}

testApi();
