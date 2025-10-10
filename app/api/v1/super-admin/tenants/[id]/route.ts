import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET /api/v1/super-admin/tenants/[id] - Get tenant details
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

    if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'super-admin')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const tenantId = params.id

    // Get tenant with counts
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        businessType: {
          select: {
            nameEn: true,
            nameAr: true
          }
        },
        _count: {
          select: {
            categories: true,
            products: true,
            tenantUsers: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      )
    }

    const tenantData = {
      ...tenant,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
      businessType: tenant.businessType?.nameEn || 'Unknown',
      _count: {
        ...tenant._count,
        users: tenant._count.tenantUsers
      }
    }

    return NextResponse.json({
      success: true,
      data: tenantData,
      message: 'Tenant details retrieved successfully'
    })

  } catch (error) {
    console.error('Get tenant details error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve tenant details' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/super-admin/tenants/[id] - Update tenant
export async function PUT(
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

    if (!payload || (payload.role !== 'super-admin' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const tenantId = params.id
    const updateData = await request.json()

    console.log('Raw updateData received:', JSON.stringify(updateData, null, 2))

    // Validate the tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!existingTenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Filter updateData to only include fields that can be updated
    const allowedFields = [
      'slug', 'businessName', 'businessNameAr', 'businessTypeId', 'email', 'phone',
      'address', 'addressAr', 'ownerName', 'ownerEmail', 'ownerPhone', 'customDomain',
      'subdomain', 'defaultLanguage', 'currency', 'timezone', 'logoUrl', 'primaryColor',
      'secondaryColor', 'accentColor', 'customCSS', 'description', 'descriptionAr',
      'subscriptionStatus', 'subscriptionPlan', 'monthlyFee', 'lastPaymentDate',
      'nextPaymentDate', 'overdueSince', 'suspendedAt', 'isActive'
    ]

    const filteredUpdateData: any = {}
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        filteredUpdateData[field] = updateData[field]
      }
    }

    console.log('Filtered updateData:', JSON.stringify(filteredUpdateData, null, 2))

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...filteredUpdateData,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            categories: true,
            products: true
          }
        }
      }
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'TENANT',
        resourceId: tenantId,
        userId: payload.sub as string,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'PUT',
        requestUrl: `/api/v1/super-admin/tenants/${tenantId}`,
        oldValues: JSON.stringify(existingTenant),
        newValues: JSON.stringify(updateData)
      }
    })

    const tenantData = {
      ...updatedTenant,
      createdAt: updatedTenant.createdAt.toISOString(),
      updatedAt: updatedTenant.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: tenantData,
      message: 'Tenant updated successfully'
    })

  } catch (error) {
    console.error('Update tenant error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/super-admin/tenants/[id] - Delete a tenant
export async function DELETE(
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

    if (!payload || (payload.role !== 'super-admin' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      )
    }

    const tenantId = params.id

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        id: true, 
        businessName: true,
        slug: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Start transaction to delete all related data
    await prisma.$transaction(async (tx) => {
      // Get all users associated with this tenant
      const tenantUserIds = await tx.tenantUser.findMany({
        where: { tenantId: tenantId },
        select: { userId: true }
      })
      const userIds = tenantUserIds.map(tu => tu.userId)

      // Delete audit logs related to this tenant or its users
      await tx.auditLog.deleteMany({
        where: {
          OR: [
            { tenantId: tenantId },
            { userId: { in: userIds } }
          ]
        }
      })

      // Delete payment records
      await tx.paymentRecord.deleteMany({
        where: { tenantId: tenantId }
      })

      // Delete all products (cascade will handle related records)
      await tx.product.deleteMany({
        where: { tenantId: tenantId }
      })

      // Delete all categories
      await tx.category.deleteMany({
        where: { tenantId: tenantId }
      })

      // Delete tenant user relationships
      await tx.tenantUser.deleteMany({
        where: { tenantId: tenantId }
      })

      // Delete users who only belong to this tenant
      const usersToDelete = await tx.user.findMany({
        where: {
          id: { in: userIds },
          tenantUsers: {
            none: {} // Users with no other tenant relationships
          }
        },
        select: { id: true }
      })

      if (usersToDelete.length > 0) {
        await tx.user.deleteMany({
          where: {
            id: {
              in: usersToDelete.map(u => u.id)
            }
          }
        })
      }

      // Finally, delete the tenant
      await tx.tenant.delete({
        where: { id: tenantId }
      })
    })

    // Create audit log for super admin
    console.log(`Tenant deleted: ${tenant.businessName} (${tenant.slug}) by super admin`)

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenant.businessName}" has been permanently deleted`
    })

  } catch (error) {
    console.error('Tenant deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}