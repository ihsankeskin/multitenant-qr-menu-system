import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { calculateTenantBilling, generateInvoiceNumber } from '@/lib/billing'
import { objectToJson } from '@/lib/validation'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('===== TENANTS API CALLED (v59c6e93-ULTRA-SIMPLIFIED) =====')
  console.log('Timestamp:', new Date().toISOString())
  console.log('URL:', request.url)
  console.log('Deployment fresh:', new Date().toISOString())
  
  try {
    console.log('Step 1: Checking authorization header...')
    // Verify authentication and super admin role
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
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
    console.log('Step 2: Verifying token...')
    const decodedToken = await verifyToken(token)
    console.log('Token decoded:', !!decodedToken, 'Role:', decodedToken?.role)
    
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

    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const plan = url.searchParams.get('plan') || ''
    const businessType = url.searchParams.get('businessType') || ''

    const skip = (page - 1) * limit

    console.log('Step 3: Building query...')
    console.log('Params:', { page, limit, search, status, plan, businessType })
    
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
      where.businessType = {
        OR: [
          { nameEn: businessType },
          { nameAr: businessType }
        ]
      }
    }

    console.log('Step 4: Executing Prisma queries...')
    console.log('Where clause:', JSON.stringify(where))
    
    // Get tenants with pagination - select only needed fields to avoid 5MB limit
    const [tenants, totalCount] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          businessName: true,
          businessNameAr: true,
          email: true,
          phone: true,
          address: true,
          ownerName: true,
          ownerEmail: true,
          ownerPhone: true,
          customDomain: true,
          subdomain: true,
          logoUrl: true,
          // Exclude logoImage and coverImage (base64 data - too large!)
          primaryColor: true,
          secondaryColor: true,
          accentColor: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          monthlyFee: true,
          lastPaymentDate: true,
          nextPaymentDate: true,
          overdueSince: true,
          createdAt: true,
          updatedAt: true,
          businessType: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true,
            },
          },
          _count: {
            select: {
              products: true,
              categories: true,
              tenantUsers: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ])
    
    console.log('Step 5: Queries executed successfully')
    console.log('Tenants found:', tenants.length)
    console.log('Total count:', totalCount)
    
    console.log('Step 6: Calculating revenue for each tenant...')
    // Calculate total revenue for each tenant from payment records
    const tenantsWithRevenue = await Promise.all(
      tenants.map(async (tenant) => {
        let revenue = 0
        try {
          const revenueResult = await prisma.paymentRecord.aggregate({
            where: {
              tenantId: tenant.id,
              status: 'PAID'
            },
            _sum: { amount: true }
          })
          revenue = Number(revenueResult._sum?.amount || 0)
        } catch (revenueError) {
          console.error(`Failed to calculate revenue for tenant ${tenant.id}:`, revenueError)
        }

        return {
          id: tenant.id,
          name: tenant.businessName,
          businessName: tenant.businessName,
          slug: tenant.slug,
          businessType: tenant.businessType?.nameEn || 'Unknown',
          status: tenant.subscriptionStatus,
          subscriptionPlan: tenant.subscriptionPlan,
          ownerName: tenant.ownerName,
          ownerEmail: tenant.ownerEmail,
          ownerPhone: tenant.ownerPhone,
          customDomain: tenant.customDomain,
          subdomain: tenant.subdomain,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          accentColor: tenant.accentColor,
          monthlyFee: tenant.monthlyFee,
          lastPaymentDate: tenant.lastPaymentDate,
          nextPaymentDate: tenant.nextPaymentDate,
          overdueSince: tenant.overdueSince,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          revenue: revenue,
          counts: {
            users: tenant._count.tenantUsers,
            categories: tenant._count.categories,
            products: tenant._count.products
          }
        }
      })
    )
    
    console.log('Step 7: Revenue calculation complete')

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

  } catch (error: any) {
    console.error('====== TENANTS API ERROR ======')
    console.error('Error message:', error?.message)
    console.error('Error name:', error?.name)
    console.error('Error stack:', error?.stack)
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    console.error('API Version: e9018a8')
    console.error('Timestamp:', new Date().toISOString())
    console.error('===============================')
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve tenants',
        error: 'INTERNAL_ERROR',
        debug: {
          message: error?.message,
          name: error?.name,
          stack: error?.stack?.substring(0, 500)
        }
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
      businessNameTr,
      businessNameAr,
      businessTypeId,
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      addressTr,
      addressAr,
      customDomain,
      subdomain,
      subscriptionPlan,
      monthlyFee,
      primaryColor,
      secondaryColor,
      accentColor,
      currency,
      defaultLanguage,
      timezone,
      logoImage,
      coverImage
    } = body

    // Validate required fields
    if (!businessName || !businessNameTr || !businessTypeId || !ownerName || !ownerEmail || !subdomain) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: businessName, businessNameTr, businessTypeId, ownerName, ownerEmail, subdomain',
          error: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    // Use the subdomain field as the slug (it should already be validated on frontend)
    let slug = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    let counter = 1
    const baseSlug = slug
    
    // Ensure slug is unique
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Calculate prorated billing for the first payment
    const joinDate = new Date()
    const monthlyFeeAmount = parseFloat(String(monthlyFee)) || 1000.00
    const billingInfo = calculateTenantBilling(monthlyFeeAmount, joinDate)

    // Create tenant with proper payment dates
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        businessName,
        businessNameTr,
        businessNameAr,
        businessTypeId,
        email: ownerEmail, // Use owner email as tenant email
        ownerName,
        ownerEmail,
        ownerPhone,
        address,
        addressTr,
        addressAr,
        customDomain,
        subdomain,
        subscriptionPlan: subscriptionPlan || 'BASIC',
        monthlyFee: monthlyFeeAmount,
        primaryColor,
        secondaryColor,
        accentColor,
        currency: currency || 'TRY',
        defaultLanguage: defaultLanguage || 'tr',
        timezone,
        logoImage: logoImage || null,
        coverImage: coverImage || null,
        nextPaymentDate: billingInfo.nextPaymentDate,
        createdById: String(decodedToken.sub || decodedToken.id || decodedToken.userId || 'unknown')
      },
      include: {
        businessType: true
      }
    })

    // Create the first payment record (prorated if joined mid-month)
    const firstPaymentRecord = await prisma.paymentRecord.create({
      data: {
        tenantId: tenant.id,
        amount: billingInfo.firstPaymentAmount,
        currency: currency || 'EGP',
        method: 'BANK_TRANSFER',
        status: 'PENDING',
        description: billingInfo.firstPaymentProrated 
          ? `Initial prorated payment for ${billingInfo.firstPaymentPeriod}`
          : `Monthly subscription fee for ${billingInfo.firstPaymentPeriod}`,
        invoiceNumber: generateInvoiceNumber(tenant.id, joinDate),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        notes: billingInfo.firstPaymentProrated 
          ? `Prorated for ${billingInfo.daysInFirstPeriod} days of ${billingInfo.totalDaysInMonth} days in month`
          : 'Regular monthly subscription fee',
        createdById: String(decodedToken.sub || decodedToken.id || decodedToken.userId || 'unknown')
      }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'TENANT',
        resourceId: tenant.id,
        userId: String(decodedToken.sub || decodedToken.id || decodedToken.userId || 'unknown'),
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'POST',
        requestUrl: '/api/v1/super-admin/tenants',
        newValues: objectToJson({
          tenantId: tenant.id,
          businessName: tenant.businessName,
          businessType: tenant.businessType?.nameEn || 'Unknown',
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
          businessType: tenant.businessType?.nameEn || 'Unknown',
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