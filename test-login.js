// Test script to verify login functionality
const https = require('http');

const baseUrl = 'http://localhost:3000';

// Test Super Admin Login
async function testSuperAdminLogin() {
  console.log('🔐 Testing Super Admin Login...');
  
  const loginData = JSON.stringify({
    email: 'admin@qrmenu.system',
    password: 'SuperAdmin123!'
  });

  try {
    const response = await fetch(`${baseUrl}/api/v1/super-admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: loginData
    });

    const data = await response.json();
    
    if (data.success && data.data.accessToken) {
      console.log('✅ Super Admin Login: SUCCESS');
      console.log(`   Token: ${data.data.accessToken.substring(0, 20)}...`);
      console.log(`   User: ${data.data.user.firstName} ${data.data.user.lastName}`);
      console.log(`   Role: ${data.data.user.role}`);
      return true;
    } else {
      console.log('❌ Super Admin Login: FAILED');
      console.log('   Error:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Super Admin Login: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

// Test Tenant Admin Login
async function testTenantAdminLogin() {
  console.log('🏪 Testing Tenant Admin Login...');
  
  const loginData = JSON.stringify({
    email: 'admin@demo-restaurant.com',
    password: 'DemoAdmin123!',
    tenantSlug: 'demo-restaurant'
  });

  try {
    const response = await fetch(`${baseUrl}/api/v1/tenant/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: loginData
    });

    const data = await response.json();
    
    if (data.success && data.data.token) {
      console.log('✅ Tenant Admin Login: SUCCESS');
      console.log(`   Token: ${data.data.token.substring(0, 20)}...`);
      console.log(`   User: ${data.data.user.firstName} ${data.data.user.lastName}`);
      console.log(`   Role: ${data.data.user.role}`);
      console.log(`   Tenant: ${data.data.tenant.businessName}`);
      return true;
    } else {
      console.log('❌ Tenant Admin Login: FAILED');
      console.log('   Error:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Tenant Admin Login: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

// Test Public Menu Access
async function testPublicMenuAccess() {
  console.log('🍽️ Testing Public Menu Access...');
  
  try {
    const response = await fetch(`${baseUrl}/api/v1/public/menu/demo-restaurant`);
    const data = await response.json();
    
    if (data.tenant && data.categories !== undefined) {
      console.log('✅ Public Menu Access: SUCCESS');
      console.log(`   Restaurant: ${data.tenant.businessName}`);
      console.log(`   Categories: ${data.categories.length}`);
      return true;
    } else {
      console.log('❌ Public Menu Access: FAILED');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Public Menu Access: ERROR');
    console.log('   Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Login Tests...\n');
  
  const superAdminResult = await testSuperAdminLogin();
  console.log('');
  
  const tenantAdminResult = await testTenantAdminLogin();
  console.log('');
  
  const publicMenuResult = await testPublicMenuAccess();
  console.log('');
  
  console.log('📋 Test Results Summary:');
  console.log(`   Super Admin Login: ${superAdminResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Tenant Admin Login: ${tenantAdminResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Public Menu Access: ${publicMenuResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = superAdminResult && tenantAdminResult && publicMenuResult;
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

runTests();