#!/usr/bin/env node

const https = require('https');

async function testTenantsAPI() {
  console.log('🧪 Testing Tenants API after dynamic export fix...\n');
  
  // Step 1: Login
  console.log('Step 1: Logging in as super admin...');
  const loginData = JSON.stringify({
    email: 'admin@qrmenu.system',
    password: 'SuperAdmin123!'
  });

  const loginPromise = new Promise((resolve, reject) => {
    const options = {
      hostname: 'themenugenie.com',
      path: '/api/v1/super-admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  const loginResult = await loginPromise;
  
  if (!loginResult.success) {
    console.error('❌ Login failed:', loginResult);
    return;
  }

  const token = loginResult.data.accessToken;
  console.log('✅ Login successful');
  console.log(`   Token: ${token.substring(0, 20)}...`);

  // Step 2: Fetch tenants
  console.log('\nStep 2: Fetching tenants...');
  
  const tenantsPromise = new Promise((resolve, reject) => {
    const options = {
      hostname: 'themenugenie.com',
      path: '/api/v1/super-admin/tenants?limit=10',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });

  const tenantsResult = await tenantsPromise;
  
  if (tenantsResult.status === 200 && tenantsResult.data.success) {
    console.log('✅ Tenants API working!');
    console.log(`   Found ${tenantsResult.data.data.tenants.length} tenants:`);
    tenantsResult.data.data.tenants.forEach((tenant, i) => {
      console.log(`   ${i + 1}. ${tenant.businessName} (${tenant.slug})`);
    });
    console.log('\n🎉 SUCCESS! The 500 error is FIXED!');
  } else {
    console.log('❌ Tenants API still failing');
    console.log('   Response:', JSON.stringify(tenantsResult.data, null, 2));
  }
}

testTenantsAPI().catch(console.error);
