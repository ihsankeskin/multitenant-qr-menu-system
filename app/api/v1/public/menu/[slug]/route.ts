import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonToStringArray } from '@/lib/validation'

// GET /api/v1/public/menu/[slug] - Get public menu for customers
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const tenantSlug = params.slug

    // Get tenant information
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: tenantSlug,
        isActive: true
      },
      select: {
        id: true,
        businessName: true,
        businessNameTr: true,
        businessNameAr: true,
        slug: true,
        subdomain: true,
        description: true,
        descriptionTr: true,
        descriptionAr: true,
        logoUrl: true,
        logoImage: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        currency: true,
        address: true,
        addressTr: true,
        addressAr: true,
        phone: true,
        email: true,
        isActive: true,
        defaultLanguage: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get active categories with their products
    const categories = await prisma.category.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        products: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            nameTr: true,
            nameEn: true,
            nameAr: true,
            descriptionTr: true,
            descriptionEn: true,
            descriptionAr: true,
            imageUrl: true,
            imageUrls: true,
            basePrice: true,
            discountPrice: true,
            discountStartDate: true,
            discountEndDate: true,
            isFeatured: true,
            isOutOfStock: true,
            preparationTime: true,
            servingSize: true,
            calories: true,
            ingredientsTr: true,
            ingredientsEn: true,
            ingredientsAr: true,
            allergensTr: true,
            allergensEn: true,
            allergensAr: true
          },
          orderBy: [
            { isFeatured: 'desc' },
            { nameTr: 'asc' }
          ]
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    // Filter out categories with no products
    const categoriesWithProducts = categories.filter((category) => category.products.length > 0)

    // Transform products data
    const transformedCategories = categoriesWithProducts.map((category) => ({
      id: category.id,
      nameTr: category.nameTr,
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      descriptionTr: category.descriptionTr,
      descriptionEn: category.descriptionEn,
      descriptionAr: category.descriptionAr,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      products: category.products.map((product) => {
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
          nameTr: product.nameTr,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          descriptionTr: product.descriptionTr,
          descriptionEn: product.descriptionEn,
          descriptionAr: product.descriptionAr,
          imageUrl: product.imageUrl,
          imageUrls: jsonToStringArray(product.imageUrls),
          basePrice: basePrice,
          discountPrice: hasActiveDiscount ? discountPrice : null,
          currentPrice: currentPrice,
          hasDiscount: hasActiveDiscount,
          discountPercentage: hasActiveDiscount && discountPrice ? 
            Math.round(((basePrice - discountPrice) / basePrice) * 100) : 
            null,
          isFeatured: product.isFeatured,
          isOutOfStock: product.isOutOfStock,
          preparationTime: product.preparationTime,
          servingSize: product.servingSize,
          calories: product.calories,
          ingredientsTr: jsonToStringArray(product.ingredientsTr),
          ingredientsEn: jsonToStringArray(product.ingredientsEn),
          ingredientsAr: jsonToStringArray(product.ingredientsAr),
          allergensTr: jsonToStringArray(product.allergensTr),
          allergensEn: jsonToStringArray(product.allergensEn),
          allergensAr: jsonToStringArray(product.allergensAr)
        }
      })
    }))

    // Get featured products across all categories
    const featuredProducts = transformedCategories
      .flatMap((category) => category.products)
      .filter((product) => product.isFeatured && !product.isOutOfStock)
      .slice(0, 6) // Limit to 6 featured items

    // Calculate basic statistics
    const totalProducts = transformedCategories.reduce((sum: number, cat) => sum + cat.products.length, 0)
    const availableProducts = transformedCategories.reduce((sum: number, cat) =>
      sum + cat.products.filter((p) => !p.isOutOfStock).length, 0)

    // Log menu view (optional analytics)
    try {
      // For public menu access, we'll create a simplified log without full audit requirements
      console.log(`Public menu accessed: ${tenantSlug}, Categories: ${categoriesWithProducts.length}, Products: ${totalProducts}`)
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn('Failed to log menu view:', logError)
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        businessName: tenant.businessName,
        businessNameTr: tenant.businessNameTr,
        businessNameAr: tenant.businessNameAr,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        accentColor: tenant.accentColor,
        logoUrl: tenant.logoImage || tenant.logoUrl,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        addressTr: tenant.addressTr,
        addressAr: tenant.addressAr
      },
      categories: transformedCategories,
      settings: {
        showPrices: true,
        showCalories: true,
        showDescriptions: true,
        showImages: true,
        defaultLanguage: tenant.defaultLanguage || 'tr',
        enableBilingualMenu: true,
        currency: tenant.currency || 'USD',
        currencyPosition: 'before',
        businessHours: {
          monday: { isOpen: true, open: '09:00', close: '22:00' },
          tuesday: { isOpen: true, open: '09:00', close: '22:00' },
          wednesday: { isOpen: true, open: '09:00', close: '22:00' },
          thursday: { isOpen: true, open: '09:00', close: '22:00' },
          friday: { isOpen: true, open: '09:00', close: '23:00' },
          saturday: { isOpen: true, open: '09:00', close: '23:00' },
          sunday: { isOpen: true, open: '10:00', close: '21:00' }
        }
      },
      featuredProducts: featuredProducts,
      statistics: {
        totalCategories: categoriesWithProducts.length,
        totalProducts: totalProducts,
        availableProducts: availableProducts,
        outOfStockProducts: totalProducts - availableProducts
      },
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Public menu fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load menu' },
      { status: 500 }
    )
  }
}

// GET /api/v1/public/menu/[slug]/product/[productId] - Get single product details for public view
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const tenantSlug = params.slug
    const body = await request.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get tenant information
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: tenantSlug,
        isActive: true
      },
      select: {
        id: true,
        businessName: true,
        businessNameAr: true,
        currency: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get product details
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        category: {
          select: {
            nameEn: true,
            nameAr: true
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

    // Check if discount is active
    const now = new Date()
    const hasActiveDiscount = product.discountPrice && 
      product.discountStartDate && 
      product.discountEndDate &&
      now >= product.discountStartDate && 
      now <= product.discountEndDate

    const basePrice = Number(product.basePrice)
    const discountPrice = product.discountPrice ? Number(product.discountPrice) : null
    const currentPrice = hasActiveDiscount && discountPrice ? discountPrice : basePrice

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
        basePrice: basePrice,
        discountPrice: hasActiveDiscount ? discountPrice : null,
        currentPrice: currentPrice,
        hasDiscount: hasActiveDiscount,
        discountPercentage: hasActiveDiscount && discountPrice ? 
          Math.round(((basePrice - discountPrice) / basePrice) * 100) : 
          null,
        isOutOfStock: product.isOutOfStock,
        preparationTime: product.preparationTime,
        servingSize: product.servingSize,
        calories: product.calories,
        ingredientsEn: jsonToStringArray(product.ingredientsEn),
        ingredientsAr: jsonToStringArray(product.ingredientsAr),
        allergensEn: jsonToStringArray(product.allergensEn),
        allergensAr: jsonToStringArray(product.allergensAr),
        category: product.category,
        restaurant: {
          businessName: tenant.businessName,
          businessNameAr: tenant.businessNameAr,
          currency: tenant.currency
        }
      }
    })

  } catch (error) {
    console.error('Public product fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load product details' },
      { status: 500 }
    )
  }
}
