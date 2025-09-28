import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Multi-Tenant QR Menu System
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            A comprehensive SaaS platform for restaurants to create and manage their digital menus with QR code integration
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="text-blue-600 text-4xl mb-4">👑</div>
              <h3 className="text-xl font-semibold mb-4">Super Admin Panel</h3>
              <p className="text-gray-600 mb-6">
                Manage all tenants, billing, and system-wide configurations
              </p>
              <Link 
                href="/super-admin/login"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Access Super Admin
              </Link>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="text-green-600 text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold mb-4">Tenant Admin Panel</h3>
              <p className="text-gray-600 mb-6">
                Manage your restaurant menu, categories, and products
              </p>
              <Link 
                href="/tenant/demo-restaurant/login"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
              >
                Access Admin Panel
              </Link>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="text-purple-600 text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-4">Public Menus</h3>
              <p className="text-gray-600 mb-6">
                View restaurant menus with QR code scanning
              </p>
              <Link 
                href="/menu/demo-restaurant"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-block"
              >
                View Demo Menu
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Multi-Tenant Architecture</h4>
                <p className="text-gray-600">Complete tenant isolation with dynamic branding and billing</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Dynamic Branding</h4>
                <p className="text-gray-600">Automatic color extraction from logos with theme generation</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Bilingual Support</h4>
                <p className="text-gray-600">Full Arabic and English interface with RTL support</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Mobile-First Design</h4>
                <p className="text-gray-600">Responsive design optimized for mobile QR code scanning</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Role-Based Access</h4>
                <p className="text-gray-600">Comprehensive RBAC with Super Admin, Tenant Admin, and Staff roles</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Billing Management</h4>
                <p className="text-gray-600">Automated billing with grace periods and suspension handling</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}