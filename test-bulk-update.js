const https = require('https');

async function testBulkUpdate() {
  console.log('🧪 Testing Bulk Update Status API\n');
  
  // Step 1: Login
  console.log('Step 1: Logging in...');
  const loginData = JSON.stringify({
    email: 'admin@qrmenu.system',
    password: 'SuperAdmin123!'
  });

  const loginResponse = await new Promise((resolve, reject) => {
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

  const token = loginResponse.data.token;
  console.log('✅ Login successful\n');

  // Step 2: Get some payments
  console.log('Step 2: Fetching payments...');
  const paymentsResponse = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'themenugenie.com',
      path: '/api/v1/super-admin/financials/payments',
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

  console.log('Status:', paymentsResponse.status);
  const payments = paymentsResponse.body.data?.payments || [];
  console.log('Found', payments.length, 'payments');
  
  if (payments.length === 0) {
    console.log('❌ No payments to test with');
    return;
  }

  const paymentIds = payments.slice(0, 2).map(p => p.id);
  console.log('Selected payment IDs:', paymentIds);
  console.log('');

  // Step 3: Try bulk update
  console.log('Step 3: Testing bulk update...');
  const bulkData = JSON.stringify({
    paymentIds: paymentIds,
    status: 'PAID'
  });

  const bulkResponse = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'themenugenie.com',
      path: '/api/v1/super-admin/financials/bulk-update-status',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': bulkData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, parseError: true });
        }
      });
    });
    req.on('error', reject);
    req.write(bulkData);
    req.end();
  });

  console.log('Status:', bulkResponse.status);
  console.log('Response:', JSON.stringify(bulkResponse.body, null, 2));
  
  if (bulkResponse.status === 200) {
    console.log('\n✅ SUCCESS! Bulk update working');
  } else {
    console.log('\n❌ FAILED! See error above');
  }
}

testBulkUpdate().catch(console.error);
