import Link from 'next/link'
import { prisma } from '@/lib/prisma'

async function getActiveMenus() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        businessName: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        phone: true,
        categories: {
          where: {
            isActive: true
          },
          select: {
            _count: {
              select: {
                products: {
                  where: {
                    isActive: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        businessName: 'asc'
      }
    })

    // Calculate total products for each tenant
    return tenants.map(tenant => ({
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      phone: tenant.phone,
      productCount: tenant.categories.reduce((sum: number, cat) => sum + cat._count.products, 0),
      categoryCount: tenant.categories.length
    }))
  } catch (error) {
    console.error('Error fetching menus:', error)
    return []
  }
}

export default async function HomePage() {
  const menus = await getActiveMenus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.jpg" 
                alt="The Menu Genie" 
                className="h-12 w-12 rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">The Menu Genie</h1>
                <p className="text-sm text-gray-600">All Your Favorite Menus in One Place</p>
              </div>
            </div>
            <Link 
              href="/super-admin/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🍽️ Discover All Menus
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Browse digital menus from all your favorite restaurants - All in one convenient place
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md">
            <span className="text-lg font-semibold text-gray-900">{menus.length}</span>
            <span className="ml-2 text-gray-600">Restaurant Menus Available</span>
          </div>
        </div>

        {/* Menus Grid */}
        {menus.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍴</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Menus Available Yet</h3>
            <p className="text-gray-600">Check back soon for restaurant menus!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menus.map((menu) => (
              <Link 
                key={menu.id}
                href={`/menu/${menu.slug}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              >
                {/* Logo Section */}
                <div 
                  className="h-40 flex items-center justify-center p-6 relative overflow-hidden"
                  style={{ 
                    backgroundColor: menu.primaryColor || '#6B7280',
                    background: `linear-gradient(135deg, ${menu.primaryColor || '#6B7280'} 0%, ${menu.secondaryColor || '#9CA3AF'} 100%)`
                  }}
                >
                  {menu.logoUrl ? (
                    <img 
                      src={menu.logoUrl}
                      alt={menu.businessName}
                      className="max-h-28 max-w-full object-contain drop-shadow-2xl"
                    />
                  ) : (
                    <div className="text-6xl">🍽️</div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      View Menu →
                    </span>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {menu.businessName}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <span>📋</span>
                      <span>{menu.categoryCount} Categories</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>🍔</span>
                      <span>{menu.productCount} Items</span>
                    </div>
                  </div>

                  {menu.phone && (
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <span className="mr-2">📞</span>
                      <span dir="ltr">{menu.phone}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">View Digital Menu</span>
                      <svg 
                        className="w-5 h-5 text-orange-500 transform group-hover:translate-x-1 transition-transform" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">© 2025 The Menu Genie - All Your Menus in One Place</p>
            <p className="text-sm">Digital menu platform for restaurants</p>
          </div>
        </div>
      </footer>
    </div>
  )
}