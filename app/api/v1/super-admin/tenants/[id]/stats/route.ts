import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/v1/super-admin/tenants/[id]/stats - Get tenant statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)
  
  if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN')) {
    return NextResponse.json(
      { success: false, message: 'Access denied' },
      { status: 403 }
    )
  }    const tenantId = params.id

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get comprehensive statistics
    const [
      totalCategories,
      totalProducts,
      activeProducts,
      totalUsers,
      activeUsers,
      lastActivity
    ] = await Promise.all([
      // Total categories
      prisma.category.count({
        where: { tenantId: tenantId }
      }),
      
      // Total products
      prisma.product.count({
        where: { tenantId: tenantId }
      }),
      
      // Active products
      prisma.product.count({
        where: { 
          tenantId: tenantId,
          isActive: true,
          isOutOfStock: false
        }
      }),
      
      // Total users
      prisma.tenantUser.count({
        where: { tenantId: tenantId }
      }),
      
      // Active users
      prisma.tenantUser.count({
        where: { 
          tenantId: tenantId,
          isActive: true,
          user: {
            isActive: true
          }
        }
      }),
      
      // Last activity (most recent audit log entry)
      prisma.auditLog.findFirst({
        where: { tenantId: tenantId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ])

    // Mock menu views (in a real implementation, you'd track this)
    const menuViews = Math.floor(Math.random() * 1000) + 100

    const stats = {
      totalCategories,
      totalProducts,
      activeProducts,
      totalUsers,
      activeUsers,
      menuViews,
      lastActivity: lastActivity?.createdAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Tenant statistics retrieved successfully'
    })

  } catch (error) {
    console.error('Get tenant stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve tenant statistics' },
      { status: 500 }
    )
  }
}