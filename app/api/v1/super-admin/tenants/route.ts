import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { objectToJson } from '@/lib/validation'

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
    
    if (!decodedToken || decodedToken.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. Super admin role required',
          error: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const plan = url.searchParams.get('plan') || ''
    const businessType = url.searchParams.get('businessType') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { ownerEmail: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.subscriptionStatus = status
    }

    if (plan) {
      where.subscriptionPlan = plan
    }

    if (businessType) {
      where.businessType = { name: businessType }
    }

    // Get tenants with pagination
    const [tenants, totalCount] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          businessType: true,
          _count: {
            select: {
              tenantUsers: true,
              categories: true,
              products: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tenant.count({ where })
    ])

    // Calculate total revenue for each tenant from payment records
    const tenantsWithRevenue = await Promise.all(
      tenants.map(async (tenant) => {
        const revenueResult = await prisma.paymentRecord.aggregate({
          where: {
            tenantId: tenant.id,
            status: 'PAID'
          },
          _sum: { amount: true }
        })

        return {
          id: tenant.id,
          name: tenant.businessName,
          businessType: tenant.businessType.nameEn,
          status: tenant.subscriptionStatus,
          subscriptionPlan: tenant.subscriptionPlan,
          ownerName: tenant.ownerName,
          ownerEmail: tenant.ownerEmail,
          ownerPhone: tenant.ownerPhone,
          customDomain: tenant.customDomain,
          subdomain: tenant.subdomain,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          monthlyFee: tenant.monthlyFee,
          lastPaymentDate: tenant.lastPaymentDate,
          nextPaymentDate: tenant.nextPaymentDate,
          overdueSince: tenant.overdueSince,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          revenue: Number(revenueResult._sum?.amount || 0),
          counts: {
            users: tenant._count.tenantUsers,
            categories: tenant._count.categories,
            products: tenant._count.products
          }
        }
      })
    )

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      message: 'Tenants retrieved successfully',
      data: {
        tenants: tenantsWithRevenue,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Tenants fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve tenants',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    
    console.log('Decoded token payload:', decodedToken) // Add debugging
    
    if (!decodedToken || decodedToken.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. Super admin role required',
          error: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      businessName,
      businessTypeId,
      ownerName,
      ownerEmail,
      ownerPhone,
      customDomain,
      subdomain,
      subscriptionPlan,
      monthlyFee,
      primaryColor,
      secondaryColor,
      accentColor
    } = body

    // Validate required fields
    if (!businessName || !businessTypeId || !ownerName || !ownerEmail) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: businessName, businessTypeId, ownerName, ownerEmail',
          error: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    // Generate unique slug from business name
    const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    let slug = baseSlug
    let counter = 1
    
    // Ensure slug is unique
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        businessName,
        businessTypeId,
        email: ownerEmail, // Use owner email as tenant email
        ownerName,
        ownerEmail,
        ownerPhone,
        customDomain,
        subdomain,
        subscriptionPlan: subscriptionPlan || 'BASIC',
        monthlyFee: parseFloat(String(monthlyFee)) || 100.00,
        primaryColor,
        secondaryColor,
        accentColor,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdById: decodedToken.sub || decodedToken.id || decodedToken.userId || 'unknown'
      },
      include: {
        businessType: true
      }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'TENANT',
        resourceId: tenant.id,
        userId: decodedToken.sub || decodedToken.id || decodedToken.userId || 'unknown',
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'POST',
        requestUrl: '/api/v1/super-admin/tenants',
        newValues: objectToJson({
          tenantId: tenant.id,
          businessName: tenant.businessName,
          businessType: tenant.businessType.nameEn,
          ownerEmail: tenant.ownerEmail
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.businessName,
          businessType: tenant.businessType.nameEn,
          ownerName: tenant.ownerName,
          ownerEmail: tenant.ownerEmail,
          ownerPhone: tenant.ownerPhone,
          customDomain: tenant.customDomain,
          subdomain: tenant.subdomain,
          subscriptionPlan: tenant.subscriptionPlan,
          subscriptionStatus: tenant.subscriptionStatus,
          monthlyFee: tenant.monthlyFee,
          createdAt: tenant.createdAt
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Tenant creation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create tenant',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}