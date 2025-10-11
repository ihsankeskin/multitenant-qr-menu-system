import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { objectToJson } from '@/lib/validation'

// GET /api/v1/tenant/categories/[id] - Get single category
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const categoryId = params.id

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      )
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId: tenantId
      },
      include: {
        products: {
          select: { 
            id: true, 
            nameEn: true, 
            nameAr: true, 
            basePrice: true,
            isActive: true,
            isFeatured: true,
            imageUrl: true
          },
          orderBy: { nameEn: 'asc' }
        },
        tenant: {
          select: { businessName: true, currency: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        },
        updatedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    const transformedCategory = {
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
      products: category.products.map(product => ({
        id: product.id,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        basePrice: product.basePrice,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        imageUrl: product.imageUrl
      })),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      createdBy: category.createdBy ? 
        `${category.createdBy.firstName} ${category.createdBy.lastName}` : 'Unknown',
      updatedBy: category.updatedBy ? 
        `${category.updatedBy.firstName} ${category.updatedBy.lastName}` : null,
      tenant: {
        businessName: category.tenant.businessName,
        currency: category.tenant.currency
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedCategory
    })

  } catch (error) {
    console.error('Category fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/tenant/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const categoryId = params.id

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      imageUrl,
      imageData,
      isActive,
      showInMenu,
      sortOrder
    } = body

    // Check if category exists and belongs to tenant
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId: tenantId
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!nameEn || !nameAr) {
      return NextResponse.json(
        { success: false, message: 'Category name in both English and Arabic is required' },
        { status: 400 }
      )
    }

    // Check for duplicate names (excluding current category)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        tenantId: tenantId,
        id: { not: categoryId },
        OR: [
          { nameEn: nameEn.trim() },
          { nameAr: nameAr.trim() }
        ]
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { success: false, message: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    // Store old values for audit log
    const oldValues = {
      nameEn: existingCategory.nameEn,
      nameAr: existingCategory.nameAr,
      isActive: existingCategory.isActive,
      showInMenu: existingCategory.showInMenu
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        descriptionEn: descriptionEn?.trim() || null,
        descriptionAr: descriptionAr?.trim() || null,
        imageUrl: imageUrl?.trim() || imageData?.trim() || null, // Use imageData as fallback
        imageData: imageData?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
        showInMenu: showInMenu !== undefined ? showInMenu : existingCategory.showInMenu,
        sortOrder: sortOrder !== undefined ? sortOrder : existingCategory.sortOrder,
        updatedById: userId,
        updatedAt: new Date()
      },
      include: {
        products: {
          select: { id: true, isActive: true }
        },
        tenant: {
          select: { businessName: true, currency: true }
        },
        createdBy: {
          select: { firstName: true, lastName: true }
        },
        updatedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'CATEGORY',
        resourceId: categoryId,
        userId: userId,
        tenantId: tenantId,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'PUT',
        requestUrl: `/api/v1/tenant/categories/${categoryId}`,
        oldValues: objectToJson(oldValues),
        newValues: objectToJson({
          nameEn: updatedCategory.nameEn,
          nameAr: updatedCategory.nameAr,
          isActive: updatedCategory.isActive,
          showInMenu: updatedCategory.showInMenu
        })
      }
    })

    const transformedCategory = {
      id: updatedCategory.id,
      nameEn: updatedCategory.nameEn,
      nameAr: updatedCategory.nameAr,
      descriptionEn: updatedCategory.descriptionEn,
      descriptionAr: updatedCategory.descriptionAr,
      imageUrl: updatedCategory.imageUrl,
      imageData: updatedCategory.imageData,
      isActive: updatedCategory.isActive,
      showInMenu: updatedCategory.showInMenu,
      sortOrder: updatedCategory.sortOrder,
      productCount: updatedCategory.products.length,
      activeProductCount: updatedCategory.products.filter(p => p.isActive).length,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
      createdBy: updatedCategory.createdBy ? 
        `${updatedCategory.createdBy.firstName} ${updatedCategory.createdBy.lastName}` : 'Unknown',
      updatedBy: updatedCategory.updatedBy ? 
        `${updatedCategory.updatedBy.firstName} ${updatedCategory.updatedBy.lastName}` : 'Unknown',
      tenant: {
        businessName: updatedCategory.tenant.businessName,
        currency: updatedCategory.tenant.currency
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: transformedCategory
    })

  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/tenant/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const categoryId = params.id

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Check if category exists and belongs to tenant
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId: tenantId
      },
      include: {
        products: {
          select: { id: true }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has products
    if (existingCategory.products.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete category that contains products. Please move or delete all products first.',
          data: { productCount: existingCategory.products.length }
        },
        { status: 409 }
      )
    }

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resource: 'CATEGORY',
        resourceId: categoryId,
        userId: userId,
        tenantId: tenantId,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'DELETE',
        requestUrl: `/api/v1/tenant/categories/${categoryId}`,
        oldValues: objectToJson({
          nameEn: existingCategory.nameEn,
          nameAr: existingCategory.nameAr,
          isActive: existingCategory.isActive
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
