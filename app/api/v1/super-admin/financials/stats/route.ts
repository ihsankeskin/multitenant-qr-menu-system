import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface JwtPayload {
  userId: string
  role: string
  iat?: number
  exp?: number
}

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify token
    let payload: JwtPayload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get current date info
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    
    // Previous month for growth calculation
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const firstDayOfPreviousMonth = new Date(previousYear, previousMonth, 1)
    const lastDayOfPreviousMonth = new Date(previousYear, previousMonth + 1, 0)

    // Get financial statistics
    const [
      totalRevenueResult,
      monthlyRevenueResult,
      previousMonthRevenueResult,
      totalTenants,
      activeTenants,
      overduePayments,
      pendingPayments,
      averagePaymentResult
    ] = await Promise.all([
      // Total revenue
      prisma.paymentRecord.aggregate({
        where: {
          status: 'PAID'
        },
        _sum: {
          amount: true
        }
      }),
      
      // Current month revenue
      prisma.paymentRecord.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      // Previous month revenue
      prisma.paymentRecord.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: firstDayOfPreviousMonth,
            lte: lastDayOfPreviousMonth
          }
        },
        _sum: {
          amount: true
        }
      }),
      
      // Total tenants
      prisma.tenant.count(),
      
      // Active tenants (have made at least one payment or have active subscription)
      prisma.tenant.count({
        where: {
          OR: [
            {
              paymentHistory: {
                some: {
                  status: 'PAID'
                }
              }
            },
            {
              subscriptionStatus: 'ACTIVE'
            }
          ]
        }
      }),
      
      // Overdue payments
      prisma.paymentRecord.count({
        where: {
          status: 'OVERDUE',
          dueDate: {
            lt: now
          }
        }
      }),
      
      // Pending payments
      prisma.paymentRecord.count({
        where: {
          status: 'PENDING'
        }
      }),
      
      // Average payment amount
      prisma.paymentRecord.aggregate({
        where: {
          status: 'PAID'
        },
        _avg: {
          amount: true
        }
      })
    ])

    // Calculate revenue growth
    const currentMonthRevenue = monthlyRevenueResult._sum.amount || 0
    const previousMonthRevenue = previousMonthRevenueResult._sum.amount || 0
    let revenueGrowth = 0
    
    if (previousMonthRevenue > 0) {
      revenueGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    } else if (currentMonthRevenue > 0) {
      revenueGrowth = 100 // If no previous month revenue but current month has revenue
    }

    const stats = {
      totalRevenue: totalRevenueResult._sum.amount || 0,
      monthlyRevenue: currentMonthRevenue,
      totalTenants,
      activeTenants,
      overduePayments,
      pendingPayments,
      averagePayment: averagePaymentResult._avg.amount || 0,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100 // Round to 2 decimal places
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Financial stats API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}