import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { objectToJson } from '@/lib/validation'
// Note: jsonToStringArray, stringArrayToJson available if needed for future features

// GET /api/v1/tenant/categories - List categories with pagination and search
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
    // Note: userId available for future audit logging features
    // const userId = payload.sub as string

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'sortOrder'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const status = searchParams.get('status') || 'all'

    const offset = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      tenantId: tenantId
    }

    if (search) {
      whereClause.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { descriptionEn: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status !== 'all') {
      whereClause.isActive = status === 'active'
    }

    // Get total count
    const totalCount = await prisma.category.count({
      where: whereClause
    })

    // Get categories with product counts
    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        products: {
          select: { id: true, isActive: true }
        },
        tenant: {
          select: { businessName: true, currency: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: offset,
      take: limit
    })

    // Transform data for response
    const transformedCategories = categories.map(category => ({
      id: category.id,
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      descriptionEn: category.descriptionEn,
      descriptionAr: category.descriptionAr,
      imageUrl: category.imageUrl,
      imageData: category.imageData,
      isActive: category.isActive,
      showInMenu: category.showInMenu,
      sortOrder: category.sortOrder,
      productCount: category.products.length,
      activeProductCount: category.products.filter(p => p.isActive).length,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      createdBy: `${category.createdBy.firstName} ${category.createdBy.lastName}`,
      tenant: {
        businessName: category.tenant.businessName,
        currency: category.tenant.currency
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        categories: transformedCategories,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        },
        filters: {
          search,
          sortBy,
          sortOrder,
          status
        }
      }
    })

  } catch (error) {
    console.error('Categories list error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/tenant/categories - Create new category
export async function POST(request: NextRequest) {
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
    const userId = payload.sub as string

    const body = await request.json()
    const {
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      imageUrl,
      imageData,
      isActive = true,
      showInMenu = true,
      sortOrder = 0
    } = body

    // Validate required fields
    if (!nameEn || !nameAr) {
      return NextResponse.json(
        { success: false, message: 'Category name in both English and Arabic is required' },
        { status: 400 }
      )
    }

    // Check for duplicate names within tenant
    const existingCategory = await prisma.category.findFirst({
      where: {
        tenantId: tenantId,
        OR: [
          { nameEn: nameEn.trim() },
          { nameAr: nameAr.trim() }
        ]
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        descriptionEn: descriptionEn?.trim() || null,
        descriptionAr: descriptionAr?.trim() || null,
        imageUrl: imageUrl?.trim() || imageData?.trim() || null, // Use imageData as fallback
        imageData: imageData?.trim() || null,
        isActive,
        showInMenu,
        sortOrder,
        tenantId: tenantId,
        createdById: userId
      }
    })

    // Get category with relations for response
    const categoryWithRelations = await prisma.category.findUnique({
      where: { id: category.id },
      include: {
        tenant: {
          select: { businessName: true, currency: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'CATEGORY',
        resourceId: category.id,
        userId: userId,
        tenantId: tenantId,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'POST',
        requestUrl: '/api/v1/tenant/categories',
        newValues: objectToJson({
          nameEn: category.nameEn,
          nameAr: category.nameAr,
          isActive: category.isActive
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: category.id,
        nameEn: category.nameEn,
        nameAr: category.nameAr,
        descriptionEn: category.descriptionEn,
        descriptionAr: category.descriptionAr,
        imageUrl: category.imageUrl,
        imageData: category.imageData,
        isActive: category.isActive,
        showInMenu: category.showInMenu,
        sortOrder: category.sortOrder,
        createdAt: category.createdAt,
        createdBy: categoryWithRelations?.createdBy ? 
          `${categoryWithRelations.createdBy.firstName} ${categoryWithRelations.createdBy.lastName}` : 
          'Unknown',
        tenant: categoryWithRelations?.tenant ? {
          businessName: categoryWithRelations.tenant.businessName,
          currency: categoryWithRelations.tenant.currency
        } : null
      }
    })

  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}