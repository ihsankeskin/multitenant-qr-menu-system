import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { objectToJson, jsonToStringArray, stringArrayToJson } from '@/lib/validation'

// GET /api/v1/tenant/products - List products with pagination, search, and filters
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const status = searchParams.get('status') || 'all' // all, active, inactive, out_of_stock
    const featured = searchParams.get('featured') || 'all' // all, featured, regular
    const sortBy = searchParams.get('sortBy') || 'nameEn'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')

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

    if (categoryId && categoryId !== 'all') {
      whereClause.categoryId = categoryId
    }

    if (status === 'active') {
      whereClause.isActive = true
      whereClause.isOutOfStock = false
    } else if (status === 'inactive') {
      whereClause.isActive = false
    } else if (status === 'out_of_stock') {
      whereClause.isOutOfStock = true
    }

    if (featured === 'featured') {
      whereClause.isFeatured = true
    } else if (featured === 'regular') {
      whereClause.isFeatured = false
    }

    // Price range filter
    whereClause.basePrice = {
      gte: minPrice,
      lte: maxPrice
    }

    // Get total count
    const totalCount = await prisma.product.count({
      where: whereClause
    })

    // Get products
    const products = await prisma.product.findMany({
      where: whereClause,
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
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: offset,
      take: limit
    })

    // Transform data for response
    const transformedProducts = products.map(product => {
      // Check if discount is currently active
      const now = new Date()
      const hasActiveDiscount = product.discountPrice && 
        product.discountStartDate && 
        product.discountEndDate &&
        now >= product.discountStartDate && 
        now <= product.discountEndDate

      const basePrice = Number(product.basePrice)
      const discountPrice = product.discountPrice ? Number(product.discountPrice) : null
      const currentPrice = hasActiveDiscount && discountPrice ? discountPrice : basePrice

      return {
        id: product.id,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        descriptionEn: product.descriptionEn,
        descriptionAr: product.descriptionAr,
        imageUrl: product.imageUrl,
        imageData: product.imageData,
        imageUrls: jsonToStringArray(product.imageUrls),
        basePrice: basePrice,
        discountPrice: discountPrice,
        currentPrice: currentPrice,
        hasDiscount: hasActiveDiscount,
        discountStartDate: product.discountStartDate,
        discountEndDate: product.discountEndDate,
        isActive: product.isActive,
        isAvailable: !product.isOutOfStock, // Add isAvailable for dashboard display
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
        category: {
          id: product.category.id,
          nameEn: product.category.nameEn,
          nameAr: product.category.nameAr,
          isActive: product.category.isActive
        },
        tenant: {
          businessName: product.tenant.businessName,
          currency: product.tenant.currency
        },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        createdBy: `${product.createdBy.firstName} ${product.createdBy.lastName}`
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        products: transformedProducts,
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
          categoryId,
          status,
          featured,
          sortBy,
          sortOrder,
          minPrice,
          maxPrice
        }
      }
    })

  } catch (error) {
    console.error('Products list error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/tenant/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Products POST - Missing authorization header:', authHeader)
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (!payload || !payload.sub || !payload.tenantId) {
      console.error('Products POST - Invalid token payload:', payload)
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const tenantId = payload.tenantId as string
    const userId = payload.sub as string

    const body = await request.json()
    const {
      categoryId,
      nameTr,
      nameEn,
      nameAr,
      descriptionTr,
      descriptionEn,
      descriptionAr,
      imageUrl,
      imageData,
      imageUrls = [],
      basePrice,
      price, // Accept both price and basePrice for compatibility
      discountPrice,
      discountStartDate,
      discountEndDate,
      isActive = true,
      isAvailable, // Accept both isAvailable and isOutOfStock
      isFeatured = false,
      isOutOfStock = false,
      stockQuantity,
      preparationTime,
      servingSize,
      calories,
      ingredientsTr = [],
      ingredientsEn = [],
      ingredientsAr = [],
      allergensTr = [],
      allergensEn = [],
      allergensAr = []
    } = body

    // Use price or basePrice (whichever is provided)
    const productPrice = basePrice || price

    // Convert isAvailable to isOutOfStock if needed
    const outOfStock = isAvailable !== undefined ? !isAvailable : isOutOfStock

    // Set default discount dates if discount price is provided but dates are missing
    let finalDiscountStartDate = discountStartDate
    let finalDiscountEndDate = discountEndDate
    
    if (discountPrice && !discountStartDate) {
      finalDiscountStartDate = new Date().toISOString() // Start now
    }
    
    if (discountPrice && !discountEndDate) {
      // Set end date to 1 year from now
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
      finalDiscountEndDate = oneYearFromNow.toISOString()
    }

    // Validate required fields
    if (!categoryId || !nameTr || !nameEn || !nameAr || !productPrice) {
      console.error('Product validation error - missing fields:', {
        categoryId: !!categoryId,
        nameTr: !!nameTr,
        nameEn: !!nameEn,
        nameAr: !!nameAr,
        basePrice: !!basePrice,
        price: !!price,
        productPrice: !!productPrice,
        body
      })
      return NextResponse.json(
        { success: false, message: 'Category, product name (TR/EN/AR), and base price are required' },
        { status: 400 }
      )
    }

    // Validate price
    if (productPrice <= 0) {
      return NextResponse.json(
        { success: false, message: 'Product price must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate discount price
    if (discountPrice && discountPrice >= productPrice) {
      return NextResponse.json(
        { success: false, message: 'Discount price must be less than product price' },
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

    // Check for duplicate product names within tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        tenantId: tenantId,
        OR: [
          { nameTr: nameTr.trim() },
          { nameEn: nameEn.trim() },
          { nameAr: nameAr.trim() }
        ]
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Product with this name already exists' },
        { status: 409 }
      )
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        categoryId,
        nameTr: nameTr.trim(),
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        descriptionTr: descriptionTr?.trim() || null,
        descriptionEn: descriptionEn?.trim() || null,
        descriptionAr: descriptionAr?.trim() || null,
        imageUrl: imageUrl?.trim() || imageData?.trim() || null, // Use imageData as fallback
        imageData: imageData?.trim() || null,
        imageUrls: stringArrayToJson(imageUrls),
        basePrice: parseFloat(productPrice),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        discountStartDate: finalDiscountStartDate ? new Date(finalDiscountStartDate) : null,
        discountEndDate: finalDiscountEndDate ? new Date(finalDiscountEndDate) : null,
        isActive,
        isFeatured,
        isOutOfStock: outOfStock,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
        preparationTime: preparationTime?.trim() || null,
        servingSize: servingSize?.trim() || null,
        calories: calories ? parseInt(calories) : null,
        ingredientsTr: stringArrayToJson(ingredientsTr),
        ingredientsEn: stringArrayToJson(ingredientsEn),
        ingredientsAr: stringArrayToJson(ingredientsAr),
        allergensTr: stringArrayToJson(allergensTr),
        allergensEn: stringArrayToJson(allergensEn),
        allergensAr: stringArrayToJson(allergensAr),
        tenantId: tenantId,
        createdById: userId
      }
    })

    // Get product with relations for response
    const productWithRelations = await prisma.product.findUnique({
      where: { id: product.id },
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
        createdBy: {
          select: { 
            firstName: true, 
            lastName: true 
          }
        }
      }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'PRODUCT',
        resourceId: product.id,
        userId: userId,
        tenantId: tenantId,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'POST',
        requestUrl: '/api/v1/tenant/products',
        newValues: objectToJson({
          nameTr: product.nameTr,
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
      message: 'Product created successfully',
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
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isOutOfStock: product.isOutOfStock,
        category: productWithRelations?.category || null,
        tenant: productWithRelations?.tenant || null,
        createdAt: product.createdAt,
        createdBy: productWithRelations?.createdBy ? 
          `${productWithRelations.createdBy.firstName} ${productWithRelations.createdBy.lastName}` : 
          'Unknown'
      }
    })

  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
