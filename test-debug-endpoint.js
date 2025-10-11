const https = require('https');

async function test() {
  // Login
  const loginData = JSON.stringify({
    email: 'admin@qrmenu.system',
    password: 'SuperAdmin123!'
  });

  const loginRes = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'themenugenie.com',
      path: '/api/v1/super-admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  const token = loginRes.data.token;
  console.log('✅ Login successful\n');

  // Test the debug endpoint
  const testRes = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'themenugenie.com',
      path: '/api/v1/test-tenants',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end();
  });

  console.log('Status:', testRes.status);
  console.log('Response:', JSON.stringify(testRes.body, null, 2));
}

test().catch(console.error);
