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

    // Fetch all metrics in parallel
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      currentMonthCollected,
      previousMonthCollected,
      totalCollected,
      expectedMonthlyRevenue
    ] = await Promise.all([
      // Total tenants
      prisma.tenant.count(),

      // Active tenants
      prisma.tenant.count({
        where: { subscriptionStatus: 'ACTIVE' }
      }),

      // Total users (only tenant users, not super admins)
      prisma.tenantUser.count({
        where: {
          user: {
            isActive: true
          }
        }
      }),

      // Current month collected
      prisma.paymentRecord.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: currentMonthStart,
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) // Start of next month
          }
        },
        _sum: { amount: true }
      }),

      // Previous month collected
      prisma.paymentRecord.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: previousMonthStart,
            lt: currentMonthStart
          }
        },
        _sum: { amount: true }
      }),

      // Total collected amount (all time)
      prisma.paymentRecord.aggregate({
        where: {
          status: 'PAID'
        },
        _sum: { amount: true }
      }),

      // Expected monthly revenue (sum of all active tenant monthly fees)
      prisma.tenant.aggregate({
        where: {
          subscriptionStatus: 'ACTIVE'
        },
        _sum: { monthlyFee: true }
      })
    ])    // Calculate revenue growth percentage
    const currentCollected = Number(currentMonthCollected._sum?.amount || 0)
    const previousCollected = Number(previousMonthCollected._sum?.amount || 0)
    
    let revenueGrowth = 0
    if (previousCollected > 0) {
      revenueGrowth = Math.round(((currentCollected - previousCollected) / previousCollected) * 100)
    } else if (currentCollected > 0) {
      revenueGrowth = 100 // 100% growth if no previous revenue but current revenue exists
    }

    const stats = {
      totalTenants,
      activeTenants,
      totalUsers,
      monthlyRevenue: currentCollected, // Current month collected for backward compatibility
      revenueGrowth,
      expectedMonthlyRevenue: Number(expectedMonthlyRevenue._sum?.monthlyFee || 0),
      totalCashCollected: Number(totalCollected._sum?.amount || 0)
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