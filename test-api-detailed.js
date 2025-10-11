const https = require('https');

async function testAPI() {
  console.log('🔍 Detailed API Test\n');
  
  // Step 1: Login
  console.log('Step 1: Logging in...');
  const loginData = JSON.stringify({
    email: 'admin@qrmenu.system',
    password: 'SuperAdmin123!'
  });

  const loginResponse = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'themenugenie.com',
      path: '/api/v1/super-admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('✅ Login Status:', loginResponse.status);
  const token = loginResponse.body.data?.token;
  console.log('Token received:', token ? 'Yes' : 'No');
  console.log('');

  // Step 2: Fetch tenants with detailed error
  console.log('Step 2: Fetching tenants...');
  const tenantsResponse = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'themenugenie.com',
      path: '/api/v1/super-admin/tenants?limit=10',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data, parseError: e.message });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });

  console.log('Status:', tenantsResponse.status);
  console.log('Response Headers:', JSON.stringify(tenantsResponse.headers, null, 2));
  console.log('Response Body:', JSON.stringify(tenantsResponse.body, null, 2));
  
  if (tenantsResponse.status === 500) {
    console.log('\n❌ Still getting 500 error');
    console.log('📝 Note: Server-side console.log statements should appear in Vercel function logs');
  } else if (tenantsResponse.status === 200) {
    console.log('\n✅ SUCCESS! API is working');
    console.log('Tenants count:', tenantsResponse.body.data?.totalCount || 0);
  }
}

testAPI().catch(console.error);
