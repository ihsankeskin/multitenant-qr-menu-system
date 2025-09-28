const axios = require('axios');

async function quickTest() {
  console.log('Testing super admin login...');
  
  try {
    const response = await axios.post('http://localhost:3000/api/v1/super-admin/auth/login', {
      email: 'admin@qrmenu.system',
      password: 'SuperAdmin123!'
    });
    
    if (response.status === 200) {
      console.log('✅ Super admin login successful');
      const token = response.data.data.token;
      
      // Test analytics endpoint
      console.log('Testing analytics endpoint...');
      const analyticsResponse = await axios.get('http://localhost:3000/api/v1/super-admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Analytics endpoint working:', analyticsResponse.status);
      console.log('Data:', JSON.stringify(analyticsResponse.data.data, null, 2));
      
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

quickTest();