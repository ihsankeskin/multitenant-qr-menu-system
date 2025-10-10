import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/v1/super-admin/setup-demo-menus
export async function POST(request: NextRequest) {
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
        { success: false, message: 'Unauthorized access - Super admin only' },
        { status: 403 }
      )
    }

    const superAdminId = payload.sub as string
    const logs: string[] = []

    // Step 1: Delete Waseem tenant
    logs.push('🗑️ Deleting Waseem tenant (waseemco)...')
    
    const waseemTenant = await prisma.tenant.findFirst({
      where: { slug: 'waseemco' },
      select: { id: true, businessName: true }
    })

    if (waseemTenant) {
      logs.push(`Found tenant: ${waseemTenant.businessName}`)
      
      await prisma.$transaction(async (tx) => {
        const tenantUserIds = await tx.tenantUser.findMany({
          where: { tenantId: waseemTenant.id },
          select: { userId: true }
        })
        const userIds = tenantUserIds.map(tu => tu.userId)

        await tx.auditLog.deleteMany({
          where: {
            OR: [
              { tenantId: waseemTenant.id },
              { userId: { in: userIds } }
            ]
          }
        })

        await tx.product.deleteMany({ where: { tenantId: waseemTenant.id } })
        await tx.category.deleteMany({ where: { tenantId: waseemTenant.id } })
        await tx.tenantUser.deleteMany({ where: { tenantId: waseemTenant.id } })

        const usersToDelete = await tx.user.findMany({
          where: {
            id: { in: userIds },
            tenantUsers: { none: {} }
          },
          select: { id: true }
        })

        if (usersToDelete.length > 0) {
          await tx.user.deleteMany({
            where: { id: { in: usersToDelete.map(u => u.id) } }
          })
        }

        await tx.tenant.delete({ where: { id: waseemTenant.id } })
      })

      logs.push('✅ Waseem tenant deleted')
    } else {
      logs.push('⚠️ Waseem tenant not found - skipping')
    }

    // Step 2: Get business types
    const restaurantType = await prisma.businessType.findFirst({
      where: { nameEn: 'Restaurant' }
    })

    const cafeType = await prisma.businessType.findFirst({
      where: { nameEn: 'Cafe' }
    })

    if (!restaurantType || !cafeType) {
      return NextResponse.json({
        success: false,
        message: 'Business types not found',
        logs
      }, { status: 400 })
    }

    // Step 3: Create Restaurant
    logs.push('🍽️ Creating Bella Italia Restaurant...')

    const restaurant = await prisma.tenant.create({
      data: {
        slug: 'bella-italia',
        businessName: 'Bella Italia',
        businessNameAr: 'بيلا إيطاليا',
        businessTypeId: restaurantType.id,
        email: 'info@bellaitalia.com',
        phone: '+20 100 123 4567',
        address: '15 Tahrir Square, Downtown Cairo',
        addressAr: '15 ميدان التحرير، وسط القاهرة',
        ownerName: 'Marco Rossi',
        ownerEmail: 'admin@bellaitalia.com',
        ownerPhone: '+20 100 123 4567',
        subdomain: 'bellaitalia',
        defaultLanguage: 'ar',
        currency: 'EGP',
        timezone: 'Africa/Cairo',
        primaryColor: '#D32F2F',
        secondaryColor: '#388E3C',
        accentColor: '#FBC02D',
        description: 'Authentic Italian cuisine',
        descriptionAr: 'مطبخ إيطالي أصيل',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM',
        monthlyFee: 500,
        isActive: true,
        createdById: superAdminId
      }
    })

    const restaurantUser = await prisma.user.create({
      data: {
        email: 'admin@bellaitalia.com',
        firstName: 'Marco',
        lastName: 'Rossi',
        password: '$2a$10$xHhUvJFYvKZ9qKGVZDNqKe8T7vJk6YqKjKj4F0vRGZNqKjKj4F0vR',
        role: 'ADMIN',
        mustChangePassword: false
      }
    })

    await prisma.tenantUser.create({
      data: {
        userId: restaurantUser.id,
        tenantId: restaurant.id,
        role: 'ADMIN',
        createdById: superAdminId
      }
    })

    // Create restaurant categories and products
    const pastaCategory = await prisma.category.create({
      data: {
        tenantId: restaurant.id,
        nameEn: 'Pasta',
        nameAr: 'معكرونة',
        descriptionEn: 'Handmade pasta dishes',
        descriptionAr: 'أطباق معكرونة مصنوعة يدوياً',
        sortOrder: 1,
        isActive: true,
        createdById: superAdminId
      }
    })

    // Pasta products
    for (const product of [
      { name: 'Spaghetti Carbonara', nameAr: 'سباغيتي كاربونارا', desc: 'Classic Roman pasta', price: 150, featured: true },
      { name: 'Penne Arrabbiata', nameAr: 'بيني أرابياتا', desc: 'Spicy tomato sauce', price: 120, featured: false },
      { name: 'Fettuccine Alfredo', nameAr: 'فيتوتشيني ألفريدو', desc: 'Creamy pasta', price: 140, featured: true }
    ]) {
      await prisma.product.create({
        data: {
          tenantId: restaurant.id,
          categoryId: pastaCategory.id,
          nameEn: product.name,
          nameAr: product.nameAr,
          descriptionEn: product.desc,
          descriptionAr: product.desc,
          basePrice: product.price,
          calories: 400,
          isActive: true,
          isFeatured: product.featured,
          sortOrder: 1,
          createdById: superAdminId
        }
      })
    }

    const pizzaCategory = await prisma.category.create({
      data: {
        tenantId: restaurant.id,
        nameEn: 'Pizza',
        nameAr: 'بيتزا',
        descriptionEn: 'Wood-fired pizzas',
        descriptionAr: 'بيتزا مطهوة في الفرن',
        sortOrder: 2,
        isActive: true,
        createdById: superAdminId
      }
    })

    // Pizza products
    for (const product of [
      { name: 'Margherita', nameAr: 'مارغريتا', desc: 'Tomato, mozzarella, basil', price: 130, featured: true },
      { name: 'Quattro Formaggi', nameAr: 'أربع أجبان', desc: 'Four cheese pizza', price: 160, featured: false },
      { name: 'Pepperoni', nameAr: 'بيبروني', desc: 'Classic pepperoni', price: 145, featured: true }
    ]) {
      await prisma.product.create({
        data: {
          tenantId: restaurant.id,
          categoryId: pizzaCategory.id,
          nameEn: product.name,
          nameAr: product.nameAr,
          descriptionEn: product.desc,
          descriptionAr: product.desc,
          basePrice: product.price,
          calories: 700,
          isActive: true,
          isFeatured: product.featured,
          sortOrder: 1,
          createdById: superAdminId
        }
      })
    }

    const dessertsCategory = await prisma.category.create({
      data: {
        tenantId: restaurant.id,
        nameEn: 'Desserts',
        nameAr: 'حلويات',
        descriptionEn: 'Traditional desserts',
        descriptionAr: 'حلويات تقليدية',
        sortOrder: 3,
        isActive: true,
        createdById: superAdminId
      }
    })

    // Dessert products
    for (const product of [
      { name: 'Tiramisu', nameAr: 'تيراميسو', desc: 'Coffee and mascarpone', price: 80, featured: true },
      { name: 'Panna Cotta', nameAr: 'بانا كوتا', desc: 'Creamy dessert', price: 70, featured: false }
    ]) {
      await prisma.product.create({
        data: {
          tenantId: restaurant.id,
          categoryId: dessertsCategory.id,
          nameEn: product.name,
          nameAr: product.nameAr,
          descriptionEn: product.desc,
          descriptionAr: product.desc,
          basePrice: product.price,
          calories: 350,
          isActive: true,
          isFeatured: product.featured,
          sortOrder: 1,
          createdById: superAdminId
        }
      })
    }

    logs.push('✅ Bella Italia created with 3 categories, 8 products')

    // Step 4: Create Coffee Shop
    logs.push('☕ Creating Artisan Brew Coffee...')

    const coffeeShop = await prisma.tenant.create({
      data: {
        slug: 'artisan-brew',
        businessName: 'Artisan Brew Coffee',
        businessNameAr: 'أرتيزان برو كافيه',
        businessTypeId: cafeType.id,
        email: 'hello@artisanbrew.com',
        phone: '+20 111 234 5678',
        address: '42 Zamalek Street, Cairo',
        addressAr: '42 شارع الزمالك، القاهرة',
        ownerName: 'Sarah Ahmed',
        ownerEmail: 'admin@artisanbrew.com',
        ownerPhone: '+20 111 234 5678',
        subdomain: 'artisanbrew',
        defaultLanguage: 'ar',
        currency: 'EGP',
        timezone: 'Africa/Cairo',
        primaryColor: '#6F4E37',
        secondaryColor: '#D4A574',
        accentColor: '#2C1810',
        description: 'Specialty coffee roasted in-house',
        descriptionAr: 'قهوة مختصة محمصة محلياً',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM',
        monthlyFee: 500,
        isActive: true,
        createdById: superAdminId
      }
    })

    const coffeeShopUser = await prisma.user.create({
      data: {
        email: 'admin@artisanbrew.com',
        firstName: 'Sarah',
        lastName: 'Ahmed',
        password: '$2a$10$xHhUvJFYvKZ9qKGVZDNqKe8T7vJk6YqKjKj4F0vRGZNqKjKj4F0vR',
        role: 'ADMIN',
        mustChangePassword: false
      }
    })

    await prisma.tenantUser.create({
      data: {
        userId: coffeeShopUser.id,
        tenantId: coffeeShop.id,
        role: 'ADMIN',
        createdById: superAdminId
      }
    })

    // Espresso category
    const espressoCategory = await prisma.category.create({
      data: {
        tenantId: coffeeShop.id,
        nameEn: 'Espresso Bar',
        nameAr: 'قهوة إسبريسو',
        descriptionEn: 'Espresso-based drinks',
        descriptionAr: 'مشروبات إسبريسو',
        sortOrder: 1,
        isActive: true,
        createdById: superAdminId
      }
    })

    // Espresso products
    for (const product of [
      { name: 'Espresso', nameAr: 'إسبريسو', price: 45, featured: true },
      { name: 'Cappuccino', nameAr: 'كابتشينو', price: 50, featured: true },
      { name: 'Flat White', nameAr: 'فلات وايت', price: 55, featured: false },
      { name: 'Latte', nameAr: 'لاتيه', price: 52, featured: true }
    ]) {
      await prisma.product.create({
        data: {
          tenantId: coffeeShop.id,
          categoryId: espressoCategory.id,
          nameEn: product.name,
          nameAr: product.nameAr,
          descriptionEn: 'Premium espresso drink',
          descriptionAr: 'مشروب إسبريسو مميز',
          basePrice: product.price,
          calories: 100,
          isActive: true,
          isFeatured: product.featured,
          sortOrder: 1,
          createdById: superAdminId
        }
      })
    }

    // Brewed category
    const brewedCategory = await prisma.category.create({
      data: {
        tenantId: coffeeShop.id,
        nameEn: 'Brewed Coffee',
        nameAr: 'قهوة مخمرة',
        descriptionEn: 'Pour over coffee',
        descriptionAr: 'قهوة منسكبة',
        sortOrder: 2,
        isActive: true,
        createdById: superAdminId
      }
    })

    // Brewed products
    for (const product of [
      { name: 'V60 Pour Over', nameAr: 'في60 صب', price: 60, featured: true },
      { name: 'Cold Brew', nameAr: 'قهوة باردة', price: 58, featured: true }
    ]) {
      await prisma.product.create({
        data: {
          tenantId: coffeeShop.id,
          categoryId: brewedCategory.id,
          nameEn: product.name,
          nameAr: product.nameAr,
          descriptionEn: 'Hand-brewed coffee',
          descriptionAr: 'قهوة مخمرة يدوياً',
          basePrice: product.price,
          calories: 10,
          isActive: true,
          isFeatured: product.featured,
          sortOrder: 1,
          createdById: superAdminId
        }
      })
    }

    // Pastries category
    const pastriesCategory = await prisma.category.create({
      data: {
        tenantId: coffeeShop.id,
        nameEn: 'Pastries',
        nameAr: 'معجنات',
        descriptionEn: 'Fresh baked',
        descriptionAr: 'مخبوزات طازجة',
        sortOrder: 3,
        isActive: true,
        createdById: superAdminId
      }
    })

    // Pastry products
    for (const product of [
      { name: 'Croissant', nameAr: 'كرواسون', price: 35 },
      { name: 'Chocolate Muffin', nameAr: 'مافن شوكولاتة', price: 30 },
      { name: 'Almond Biscotti', nameAr: 'بسكوتي باللوز', price: 25 }
    ]) {
      await prisma.product.create({
        data: {
          tenantId: coffeeShop.id,
          categoryId: pastriesCategory.id,
          nameEn: product.name,
          nameAr: product.nameAr,
          descriptionEn: 'Freshly baked',
          descriptionAr: 'مخبوز طازج',
          basePrice: product.price,
          calories: 250,
          isActive: true,
          isFeatured: false,
          sortOrder: 1,
          createdById: superAdminId
        }
      })
    }

    // Specialty category
    const specialtyCategory = await prisma.category.create({
      data: {
        tenantId: coffeeShop.id,
        nameEn: 'Specialty Drinks',
        nameAr: 'مشروبات مميزة',
        descriptionEn: 'Seasonal drinks',
        descriptionAr: 'مشروبات موسمية',
        sortOrder: 4,
        isActive: true,
        createdById: superAdminId
      }
    })

    // Specialty products
    for (const product of [
      { name: 'Honey Lavender Latte', nameAr: 'لاتيه بالعسل والخزامى', price: 65, featured: true },
      { name: 'Cardamom Cappuccino', nameAr: 'كابتشينو بالهيل', price: 58, featured: true }
    ]) {
      await prisma.product.create({
        data: {
          tenantId: coffeeShop.id,
          categoryId: specialtyCategory.id,
          nameEn: product.name,
          nameAr: product.nameAr,
          descriptionEn: 'Specialty drink',
          descriptionAr: 'مشروب مميز',
          basePrice: product.price,
          calories: 150,
          isActive: true,
          isFeatured: product.featured,
          sortOrder: 1,
          createdById: superAdminId
        }
      })
    }

    logs.push('✅ Artisan Brew created with 4 categories, 11 products')
    logs.push('🎉 Demo menus setup complete!')

    return NextResponse.json({
      success: true,
      message: 'Demo menus created successfully',
      data: {
        restaurant: {
          name: 'Bella Italia',
          slug: 'bella-italia',
          login: 'admin@bellaitalia.com / 123456',
          dashboard: 'https://themenugenie.com/tenant/bella-italia/dashboard',
          menu: 'https://themenugenie.com/menu/bella-italia'
        },
        coffeeShop: {
          name: 'Artisan Brew Coffee',
          slug: 'artisan-brew',
          login: 'admin@artisanbrew.com / 123456',
          dashboard: 'https://themenugenie.com/tenant/artisan-brew/dashboard',
          menu: 'https://themenugenie.com/menu/artisan-brew'
        }
      },
      logs
    })

  } catch (error) {
    console.error('Setup demo menus error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to setup demo menus', error: String(error) },
      { status: 500 }
    )
  }
}
