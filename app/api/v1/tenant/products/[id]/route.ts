import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { objectToJson, jsonToStringArray, stringArrayToJson } from '@/lib/validation'

// GET /api/v1/tenant/products/[id] - Get single product
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
    const productId = params.id

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenantId
      },
      include: {
        category: {
          select: { 
            id: true,
            nameEn: true, 
            nameAr: true,
            isActive: true 
          }
        },
        tenant: {
          select: { 
            businessName: true, 
            currency: true 
          }
        },
        createdBy: {
          select: { 
            firstName: true, 
            lastName: true 
          }
        },
        updatedBy: {
          select: { 
            firstName: true, 
            lastName: true 
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        descriptionEn: product.descriptionEn,
        descriptionAr: product.descriptionAr,
        imageUrl: product.imageUrl,
        imageUrls: jsonToStringArray(product.imageUrls),
        basePrice: product.basePrice,
        discountPrice: product.discountPrice,
        discountStartDate: product.discountStartDate,
        discountEndDate: product.discountEndDate,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isOutOfStock: product.isOutOfStock,
        stockQuantity: product.stockQuantity,
        preparationTime: product.preparationTime,
        servingSize: product.servingSize,
        calories: product.calories,
        ingredientsEn: jsonToStringArray(product.ingredientsEn),
        ingredientsAr: jsonToStringArray(product.ingredientsAr),
        allergensEn: jsonToStringArray(product.allergensEn),
        allergensAr: jsonToStringArray(product.allergensAr),
        category: product.category,
        tenant: product.tenant,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        createdBy: `${product.createdBy.firstName} ${product.createdBy.lastName}`,
        updatedBy: product.updatedBy ? 
          `${product.updatedBy.firstName} ${product.updatedBy.lastName}` : 
          null
      }
    })

  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/tenant/products/[id] - Update product
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
    const productId = params.id

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenantId
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      categoryId,
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      imageUrl,
      imageUrls = [],
      basePrice,
      discountPrice,
      discountStartDate,
      discountEndDate,
      isActive,
      isFeatured,
      isOutOfStock,
      stockQuantity,
      preparationTime,
      servingSize,
      calories,
      ingredientsEn = [],
      ingredientsAr = [],
      allergensEn = [],
      allergensAr = []
    } = body

    // Validate required fields
    if (!categoryId || !nameEn || !nameAr || !basePrice) {
      return NextResponse.json(
        { success: false, message: 'Category, product name (EN/AR), and base price are required' },
        { status: 400 }
      )
    }

    // Validate price
    if (basePrice <= 0) {
      return NextResponse.json(
        { success: false, message: 'Base price must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate discount price
    if (discountPrice && discountPrice >= basePrice) {
      return NextResponse.json(
        { success: false, message: 'Discount price must be less than base price' },
        { status: 400 }
      )
    }

    // Check if category exists and belongs to tenant
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId: tenantId,
        isActive: true
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found or inactive' },
        { status: 400 }
      )
    }

    // Check for duplicate product names (excluding current product)
    const duplicateProduct = await prisma.product.findFirst({
      where: {
        tenantId: tenantId,
        id: { not: productId },
        OR: [
          { nameEn: nameEn.trim() },
          { nameAr: nameAr.trim() }
        ]
      }
    })

    if (duplicateProduct) {
      return NextResponse.json(
        { success: false, message: 'Product with this name already exists' },
        { status: 409 }
      )
    }

    // Store old values for audit log
    const oldValues = {
      categoryId: existingProduct.categoryId,
      nameEn: existingProduct.nameEn,
      nameAr: existingProduct.nameAr,
      basePrice: existingProduct.basePrice,
      isActive: existingProduct.isActive,
      isFeatured: existingProduct.isFeatured,
      isOutOfStock: existingProduct.isOutOfStock
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        categoryId,
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        descriptionEn: descriptionEn?.trim() || null,
        descriptionAr: descriptionAr?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        imageUrls: stringArrayToJson(imageUrls),
        basePrice: parseFloat(basePrice),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        discountStartDate: discountStartDate ? new Date(discountStartDate) : null,
        discountEndDate: discountEndDate ? new Date(discountEndDate) : null,
        isActive,
        isFeatured,
        isOutOfStock,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
        preparationTime: preparationTime?.trim() || null,
        servingSize: servingSize?.trim() || null,
        calories: calories ? parseInt(calories) : null,
        ingredientsEn: stringArrayToJson(ingredientsEn),
        ingredientsAr: stringArrayToJson(ingredientsAr),
        allergensEn: stringArrayToJson(allergensEn),
        allergensAr: stringArrayToJson(allergensAr),
        updatedAt: new Date(),
        updatedById: userId
      },
      include: {
        category: {
          select: { 
            id: true,
            nameEn: true, 
            nameAr: true 
          }
        },
        tenant: {
          select: { 
            businessName: true, 
            currency: true 
          }
        },
        updatedBy: {
          select: { 
            firstName: true, 
            lastName: true 
          }
        }
      }
    })

    // New values for audit log
    const newValues = {
      categoryId: updatedProduct.categoryId,
      nameEn: updatedProduct.nameEn,
      nameAr: updatedProduct.nameAr,
      basePrice: updatedProduct.basePrice,
      isActive: updatedProduct.isActive,
      isFeatured: updatedProduct.isFeatured,
      isOutOfStock: updatedProduct.isOutOfStock
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'PRODUCT',
        resourceId: productId,
        userId: userId,
        tenantId: tenantId,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'PUT',
        requestUrl: `/api/v1/tenant/products/${productId}`,
        oldValues: objectToJson(oldValues),
        newValues: objectToJson(newValues)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        id: updatedProduct.id,
        nameEn: updatedProduct.nameEn,
        nameAr: updatedProduct.nameAr,
        descriptionEn: updatedProduct.descriptionEn,
        descriptionAr: updatedProduct.descriptionAr,
        imageUrl: updatedProduct.imageUrl,
        imageUrls: jsonToStringArray(updatedProduct.imageUrls),
        basePrice: updatedProduct.basePrice,
        discountPrice: updatedProduct.discountPrice,
        discountStartDate: updatedProduct.discountStartDate,
        discountEndDate: updatedProduct.discountEndDate,
        isActive: updatedProduct.isActive,
        isFeatured: updatedProduct.isFeatured,
        isOutOfStock: updatedProduct.isOutOfStock,
        stockQuantity: updatedProduct.stockQuantity,
        preparationTime: updatedProduct.preparationTime,
        servingSize: updatedProduct.servingSize,
        calories: updatedProduct.calories,
        ingredientsEn: jsonToStringArray(updatedProduct.ingredientsEn),
        ingredientsAr: jsonToStringArray(updatedProduct.ingredientsAr),
        allergensEn: jsonToStringArray(updatedProduct.allergensEn),
        allergensAr: jsonToStringArray(updatedProduct.allergensAr),
        category: updatedProduct.category,
        tenant: updatedProduct.tenant,
        updatedAt: updatedProduct.updatedAt,
        updatedBy: updatedProduct.updatedBy ? 
          `${updatedProduct.updatedBy.firstName} ${updatedProduct.updatedBy.lastName}` : 
          'Unknown'
      }
    })

  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/tenant/products/[id] - Delete product
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
    const productId = params.id

    // Check if product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenantId
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Note: In a real-world application, you might want to perform a soft delete
    // or check if the product is referenced in any orders before deletion
    
    // For now, we'll perform a hard delete
    await prisma.product.delete({
      where: { id: productId }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resource: 'PRODUCT',
        resourceId: productId,
        userId: userId,
        tenantId: tenantId,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'DELETE',
        requestUrl: `/api/v1/tenant/products/${productId}`,
        oldValues: objectToJson({
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          categoryId: product.categoryId,
          basePrice: product.basePrice,
          isActive: product.isActive
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}