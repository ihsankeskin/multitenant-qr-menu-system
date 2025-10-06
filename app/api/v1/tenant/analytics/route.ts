import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/v1/tenant/analytics - Get tenant dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (!payload || !payload.sub || !payload.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const tenantId = payload.tenantId as string
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)

    // Calculate date ranges
    const now = new Date()
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
    // Note: previousStartDate is prepared for future comparison analytics
    // const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Get tenant information
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        businessName: true,
        currency: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Menu Statistics
    const [totalCategories, activeCategories, totalProducts, activeProducts, outOfStockProducts, featuredProducts] = await Promise.all([
      prisma.category.count({ where: { tenantId } }),
      prisma.category.count({ where: { tenantId, isActive: true } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.product.count({ where: { tenantId, isOutOfStock: true } }),
      prisma.product.count({ where: { tenantId, isFeatured: true, isActive: true } })
    ])

    // Product distribution by category
    const categoryStats = await prisma.category.findMany({
      where: {
        tenantId,
        isActive: true
      },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: {
        nameEn: 'asc'
      }
    })

    // Price analytics
    const priceStats = await prisma.product.aggregate({
      where: {
        tenantId,
        isActive: true
      },
      _avg: { basePrice: true },
      _min: { basePrice: true },
      _max: { basePrice: true }
    })
    
    // Convert Decimal to Number for pricing
    const avgPrice = priceStats._avg.basePrice ? Number(priceStats._avg.basePrice) : 0
    const minPrice = priceStats._min.basePrice ? Number(priceStats._min.basePrice) : 0
    const maxPrice = priceStats._max.basePrice ? Number(priceStats._max.basePrice) : 0

    // Products with active discounts
    const discountedProducts = await prisma.product.count({
      where: {
        tenantId,
        isActive: true,
        discountPrice: { not: null },
        discountStartDate: { lte: now },
        discountEndDate: { gte: now }
      }
    })

    // Recent activity (audit logs for this tenant)
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate }
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Activity summary by action
    const activitySummary = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        tenantId,
        createdAt: { gte: startDate }
      },
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: 'desc'
        }
      }
    })

    // Daily activity trend (last 30 days) - Using Prisma query instead of raw SQL
    const allActivity = await prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        userId: true
      }
    })

    // Group by date manually
    const activityByDate = allActivity.reduce((acc, log) => {
      const dateKey = log.createdAt.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = { users: new Set(), count: 0 }
      }
      acc[dateKey].users.add(log.userId)
      acc[dateKey].count++
      return acc
    }, {} as Record<string, { users: Set<string>; count: number }>)

    const dailyActivity = Object.entries(activityByDate)
      .map(([date, data]) => ({
        date,
        count: data.count,
        uniqueUsers: data.users.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Resource usage statistics
    const resourceUsage = {
      storageUsed: 0, // Storage calculation would be implemented here
      apiCallsCount: recentActivity.length,
      lastBackup: null, // Backup system integration point
      databaseSize: 0 // Database size calculation
    }

    // Performance metrics
    const performanceMetrics = {
      averageResponseTime: 0, // Response time monitoring
      uptime: 99.9, // Uptime percentage
      errorRate: 0, // Error rate calculation
      lastError: null // Last error tracking
    }

    // Menu health score calculation
    const totalMenuItems = activeCategories + activeProducts
    const completenessScore = totalMenuItems > 0 ? 
      ((activeProducts / Math.max(totalMenuItems, 1)) * 100) : 0
    
    const availabilityScore = totalProducts > 0 ? 
      (((totalProducts - outOfStockProducts) / totalProducts) * 100) : 100
    
    const engagementScore = activeProducts > 0 ? 
      ((featuredProducts / activeProducts) * 100) : 0
    
    const menuHealthScore = Math.round((completenessScore + availabilityScore + engagementScore) / 3)

    // Recent changes summary
    const recentChanges = {
      newProducts: await prisma.product.count({
        where: {
          tenantId,
          createdAt: { gte: startDate }
        }
      }),
      updatedProducts: recentActivity.filter(log => 
        log.action === 'UPDATE' && log.resource === 'PRODUCT'
      ).length,
      newCategories: await prisma.category.count({
        where: {
          tenantId,
          createdAt: { gte: startDate }
        }
      }),
      updatedCategories: recentActivity.filter(log => 
        log.action === 'UPDATE' && log.resource === 'CATEGORY'
      ).length
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          businessName: tenant.businessName,
          currency: tenant.currency,
          subscriptionPlan: tenant.subscriptionPlan,
          subscriptionStatus: tenant.subscriptionStatus,
          accountAge: Math.ceil((now.getTime() - tenant.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        },
        overview: {
          totalCategories,
          activeCategories,
          inactiveCategories: totalCategories - activeCategories,
          totalProducts,
          activeProducts,
          inactiveProducts: totalProducts - activeProducts,
          outOfStockProducts,
          availableProducts: totalProducts - outOfStockProducts,
          featuredProducts,
          discountedProducts,
          menuHealthScore
        },
        pricing: {
          averagePrice: Math.round(avgPrice * 100) / 100,
          minPrice: minPrice,
          maxPrice: maxPrice,
          discountedProducts,
          currency: tenant.currency
        },
        categories: {
          distribution: categoryStats.map(cat => ({
            id: cat.id,
            nameEn: cat.nameEn,
            nameAr: cat.nameAr,
            productCount: cat._count.products
          })),
          totalActive: activeCategories
        },
        activity: {
          summary: activitySummary.map(item => ({
            action: item.action,
            count: item._count.action
          })),
          recent: recentActivity.slice(0, 10).map(log => ({
            id: log.id,
            action: log.action,
            resource: log.resource,
            createdAt: log.createdAt,
            user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'
          })),
          dailyTrend: dailyActivity.map(item => ({
            date: item.date,
            count: item.count,
            uniqueUsers: item.uniqueUsers
          })),
          totalActivities: recentActivity.length
        },
        changes: {
          period: `${periodDays} days`,
          ...recentChanges,
          totalChanges: recentChanges.newProducts + recentChanges.updatedProducts + 
                       recentChanges.newCategories + recentChanges.updatedCategories
        },
        performance: {
          resourceUsage,
          metrics: performanceMetrics
        },
        insights: {
          recommendations: [
            ...(outOfStockProducts > (totalProducts * 0.2) ? ['Consider updating stock status for better customer experience'] : []),
            ...(featuredProducts < 3 ? ['Add more featured products to highlight popular items'] : []),
            ...(activeCategories === 0 ? ['Create categories to organize your menu'] : []),
            ...(activeProducts === 0 ? ['Add products to start showcasing your offerings'] : []),
            ...(discountedProducts === 0 ? ['Consider adding promotional discounts to boost sales'] : [])
          ],
          alerts: [
            ...(outOfStockProducts > (totalProducts * 0.5) ? [{ type: 'warning', message: 'High number of out-of-stock items' }] : []),
            ...(activeProducts === 0 ? [{ type: 'error', message: 'No active products in menu' }] : []),
            ...(activeCategories === 0 ? [{ type: 'error', message: 'No active categories in menu' }] : [])
          ]
        },
        lastUpdated: now.toISOString()
      }
    })

  } catch (error) {
    console.error('Tenant analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}