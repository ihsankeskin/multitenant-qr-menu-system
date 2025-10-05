import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing or invalid authorization header',
          error: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decodedToken = await verifyToken(token)
    
    if (!decodedToken || (decodedToken.role !== 'SUPER_ADMIN' && decodedToken.role !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. Super admin role required',
          error: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // Get current date and previous month for comparison
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get dashboard statistics
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      currentMonthRevenue,
      previousMonthRevenue,
      activeSubscriptions
    ] = await Promise.all([
      // Total tenants
      prisma.tenant.count(),
      
      // Active tenants
      prisma.tenant.count({
        where: { subscriptionStatus: 'ACTIVE' }
      }),
      
      // Total users across all tenants
      prisma.user.count({
        where: { isActive: true }
      }),
      
      // Current month revenue
      prisma.paymentRecord.aggregate({
        where: {
          createdAt: { gte: currentMonthStart },
          status: 'PAID'
        },
        _sum: { amount: true }
      }),
      
      // Previous month revenue
      prisma.paymentRecord.aggregate({
        where: {
          createdAt: { 
            gte: previousMonthStart,
            lte: previousMonthEnd
          },
          status: 'PAID'
        },
        _sum: { amount: true }
      }),
      
      // Active subscriptions (all non-basic plans)
      prisma.tenant.count({
        where: { 
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: { not: 'BASIC' }
        }
      })
    ])

    // Calculate revenue growth percentage
    const currentRevenue = Number(currentMonthRevenue._sum?.amount || 0)
    const previousRevenue = Number(previousMonthRevenue._sum?.amount || 0)
    
    let revenueGrowth = 0
    if (previousRevenue > 0) {
      revenueGrowth = Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
    } else if (currentRevenue > 0) {
      revenueGrowth = 100 // 100% growth if no previous revenue but current revenue exists
    }

    const stats = {
      totalTenants,
      activeTenants,
      totalUsers,
      monthlyRevenue: currentRevenue,
      revenueGrowth,
      activeSubscriptions
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve dashboard statistics',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}