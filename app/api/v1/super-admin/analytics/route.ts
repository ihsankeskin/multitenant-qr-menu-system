import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  id: string
  email: string
  role: string
  tenantId?: string
}

// GET /api/v1/super-admin/analytics - Get platform analytics
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, message: 'JWT secret not configured' },
        { status: 500 }
      )
    }

    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Get comprehensive analytics data
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalCategories,
      totalProducts,
      activeProducts,
      recentTenants,
      topTenants
    ] = await Promise.all([
      // Total tenants
      prisma.tenant.count(),
      
      // Active tenants (have at least one active user)
      prisma.tenant.count({
        where: {
          isActive: true
        }
      }),
      
      // Total users
      prisma.user.count(),
      
      // Active users
      prisma.user.count({
        where: { isActive: true }
      }),
      
      // Total categories across all tenants
      prisma.category.count(),
      
      // Total products across all tenants
      prisma.product.count(),
      
      // Active products (available and not out of stock)
      prisma.product.count({
        where: { 
          isActive: true,
          isOutOfStock: false
        }
      }),
      
      // Recent tenants (last 30 days)
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Top performing tenants (by product count)
      prisma.tenant.findMany({
        include: {
          _count: {
            select: {
              categories: true,
              products: true
            }
          },
          businessType: {
            select: {
              nameEn: true
            }
          }
        },
        orderBy: {
          products: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ])

    // Calculate growth rates (mock data for demo)
    const tenantGrowthRate = 15.2
    const userGrowthRate = 8.7
    const productGrowthRate = 23.4

    // Mock revenue data (in a real implementation, you'd calculate this)
    const totalRevenue = 125000
    const monthlyRevenue = 25000
    const revenueGrowthRate = 12.5

    // System health alerts (mock data)
    const systemAlerts = [
      {
        type: 'info' as const,
        message: 'System backup completed successfully',
        createdAt: new Date().toISOString()
      },
      {
        type: 'warning' as const,
        message: 'High database usage detected',
        createdAt: new Date().toISOString()
      }
    ]

    // Format top tenants data
    const formattedTopTenants = topTenants.map(tenant => ({
      id: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      email: tenant.email,
      categories: tenant._count.categories,
      products: tenant._count.products,
      isActive: tenant.isActive,
      status: tenant.isActive ? 'active' : 'inactive',
      businessType: tenant.businessType?.nameEn || 'Unknown',
      _count: {
        categories: tenant._count.categories,
        products: tenant._count.products
      },
      createdAt: tenant.createdAt.toISOString(),
      lastLoginAt: null // We'll add this field later if needed
    }))

    const analytics = {
      overview: {
        totalTenants,
        activeTenants,
        inactiveTenants: totalTenants - activeTenants,
        newTenantsThisMonth: recentTenants,
        totalCategories,
        totalProducts,
        totalActiveProducts: activeProducts,
        totalMenuViews: Math.floor(Math.random() * 10000) + 5000, // Mock data for now
        averageMenusPerTenant: totalTenants > 0 ? Math.round(totalCategories / totalTenants) : 0
      },
      trends: {
        tenantGrowth: [
          { month: 'Jan', count: Math.max(totalTenants - 30, 0), growth: tenantGrowthRate },
          { month: 'Feb', count: Math.max(totalTenants - 20, 0), growth: tenantGrowthRate },
          { month: 'Mar', count: totalTenants, growth: tenantGrowthRate }
        ],
        categoryGrowth: [
          { month: 'Jan', count: Math.max(totalCategories - 100, 0) },
          { month: 'Feb', count: Math.max(totalCategories - 50, 0) },
          { month: 'Mar', count: totalCategories }
        ],
        productGrowth: [
          { month: 'Jan', count: Math.max(totalProducts - 200, 0) },
          { month: 'Feb', count: Math.max(totalProducts - 100, 0) },
          { month: 'Mar', count: totalProducts }
        ],
        viewsGrowth: [
          { month: 'Jan', count: Math.floor(Math.random() * 5000) + 3000 },
          { month: 'Feb', count: Math.floor(Math.random() * 7000) + 4000 },
          { month: 'Mar', count: Math.floor(Math.random() * 10000) + 5000 }
        ]
      },
      tenants: formattedTopTenants,
      topPerformers: {
        mostActiveMenus: formattedTopTenants.map(tenant => ({
          tenantId: tenant.id,
          businessName: tenant.businessName,
          viewCount: Math.floor(Math.random() * 1000) + 100,
          categoryCount: tenant.categories,
          productCount: tenant.products
        })).slice(0, 3),
        newestTenants: formattedTopTenants.map(tenant => ({
          id: tenant.id,
          businessName: tenant.businessName,
          slug: tenant.slug,
          createdAt: tenant.createdAt,
          businessType: tenant.businessType
        })).slice(0, 3)
      },
      alerts: systemAlerts
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      message: 'Analytics data retrieved successfully'
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
}