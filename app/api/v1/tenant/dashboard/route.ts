import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decodedToken: any

    try {
      decodedToken = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid token',
          error: 'INVALID_TOKEN'
        },
        { status: 401 }
      )
    }

    // Get the tenant ID from the token
    const tenantId = decodedToken.tenantId

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid token: tenant ID missing',
          error: 'INVALID_TOKEN'
        },
        { status: 401 }
      )
    }

    // Get tenant basic info
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        businessName: true,
        businessNameAr: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        phone: true,
        email: true,
        address: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tenant not found',
          error: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Get dashboard statistics
    const categoriesCount = await prisma.category.count({
      where: { tenantId }
    })

    const itemsCount = await prisma.menuItem.count({
      where: {
        category: {
          tenantId
        }
      }
    })

    // Get categories with item counts
    const categories = await prisma.category.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            menuItems: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Get recent menu items (last 5)
    const recentItems = await prisma.menuItem.findMany({
      where: {
        category: {
          tenantId
        }
      },
      include: {
        category: {
          select: {
            name: true,
            nameAr: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    return NextResponse.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        tenant,
        stats: {
          categoriesCount,
          itemsCount,
          totalViews: 0, // This would come from analytics if implemented
          totalOrders: 0  // This would come from orders if implemented
        },
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          nameAr: cat.nameAr,
          itemsCount: cat._count.menuItems,
          isActive: cat.isActive
        })),
        recentItems: recentItems.map(item => ({
          id: item.id,
          name: item.name,
          nameAr: item.nameAr,
          price: item.price,
          category: {
            name: item.category.name,
            nameAr: item.category.nameAr
          },
          isActive: item.isActive,
          createdAt: item.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('Dashboard data retrieval error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}