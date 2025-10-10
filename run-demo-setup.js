/**
 * Script to call the demo menus setup API endpoint
 * This needs to be run with a super admin token
 */

const API_URL = process.env.API_URL || 'http://localhost:3000'

async function setupDemoMenus() {
  console.log('🚀 Starting demo menus setup...')
  console.log('API URL:', API_URL)
  console.log('')
  
  // You need to provide your super admin token here
  // Get it by logging in as super admin and copying the token from localStorage
  const token = process.env.SUPER_ADMIN_TOKEN
  
  if (!token) {
    console.error('❌ Error: SUPER_ADMIN_TOKEN environment variable is required')
    console.log('')
    console.log('To get your token:')
    console.log('1. Go to https://themenugenie.com/super-admin/login')
    console.log('2. Login with super admin credentials')
    console.log('3. Open browser console (F12)')
    console.log('4. Run: localStorage.getItem("token")')
    console.log('5. Copy the token value')
    console.log('6. Run: SUPER_ADMIN_TOKEN="your-token" node run-demo-setup.js')
    console.log('')
    process.exit(1)
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/super-admin/setup-demo-menus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', data.message || 'Unknown error')
      if (data.error) {
        console.error('Details:', data.error)
      }
      process.exit(1)
    }

    console.log('✅ Success!')
    console.log('')
    
    if (data.logs && data.logs.length > 0) {
      console.log('📋 Execution logs:')
      data.logs.forEach(log => console.log(log))
      console.log('')
    }

    if (data.data) {
      console.log('🎉 Demo Menus Created:')
      console.log('')
      console.log('1️⃣ Bella Italia Restaurant:')
      console.log('   Menu: ' + data.data.restaurant.menu)
      console.log('   Dashboard: ' + data.data.restaurant.dashboard)
      console.log('   Login: ' + data.data.restaurant.login)
      console.log('')
      console.log('2️⃣ Artisan Brew Coffee:')
      console.log('   Menu: ' + data.data.coffeeShop.menu)
      console.log('   Dashboard: ' + data.data.coffeeShop.dashboard)
      console.log('   Login: ' + data.data.coffeeShop.login)
      console.log('')
    }

    console.log('🌐 View all menus: https://themenugenie.com')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

setupDemoMenus()
