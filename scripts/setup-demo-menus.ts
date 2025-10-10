import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteWaseemTenant() {
  console.log('🗑️  Deleting Waseem tenant (waseemco)...\n')
  
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'waseemco' },
      select: { id: true, businessName: true, slug: true }
    })

    if (!tenant) {
      console.log('⚠️  Waseem tenant not found - skipping deletion\n')
      return
    }

    console.log(`Found tenant: ${tenant.businessName} (${tenant.slug})`)

    await prisma.$transaction(async (tx) => {
      const tenantUserIds = await tx.tenantUser.findMany({
        where: { tenantId: tenant.id },
        select: { userId: true }
      })
      const userIds = tenantUserIds.map(tu => tu.userId)

      console.log(`  - Deleting audit logs...`)
      await tx.auditLog.deleteMany({
        where: {
          OR: [
            { tenantId: tenant.id },
            { userId: { in: userIds } }
          ]
        }
      })

      console.log(`  - Deleting products...`)
      await tx.product.deleteMany({
        where: { tenantId: tenant.id }
      })

      console.log(`  - Deleting categories...`)
      await tx.category.deleteMany({
        where: { tenantId: tenant.id }
      })

      console.log(`  - Deleting tenant user relationships...`)
      await tx.tenantUser.deleteMany({
        where: { tenantId: tenant.id }
      })

      console.log(`  - Checking for orphaned users...`)
      const usersToDelete = await tx.user.findMany({
        where: {
          id: { in: userIds },
          tenantUsers: { none: {} }
        },
        select: { id: true, email: true }
      })

      if (usersToDelete.length > 0) {
        console.log(`  - Deleting ${usersToDelete.length} orphaned user(s)...`)
        await tx.user.deleteMany({
          where: { id: { in: usersToDelete.map(u => u.id) } }
        })
      }

      console.log(`  - Deleting tenant...`)
      await tx.tenant.delete({
        where: { id: tenant.id }
      })
    })

    console.log(`✅ Successfully deleted tenant: ${tenant.businessName}\n`)
  } catch (error) {
    console.error('❌ Error deleting Waseem tenant:', error)
    throw error
  }
}

async function main() {
  console.log('🎬 Starting demo menus setup...\n')

  await deleteWaseemTenant()

  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  if (!superAdmin) {
    throw new Error('No super admin found.')
  }

  console.log(`✅ Found super admin: ${superAdmin.email}\n`)

  const restaurantType = await prisma.businessType.findFirst({
    where: { nameEn: 'Restaurant' }
  })

  const cafeType = await prisma.businessType.findFirst({
    where: { nameEn: 'Cafe' }
  })

  if (!restaurantType || !cafeType) {
    throw new Error('Business types not found.')
  }

  // ==================== CREATE RESTAURANT ====================
  console.log('🍽️  Creating Italian Restaurant...')
  
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
      description: 'Authentic Italian cuisine in the heart of Cairo',
      descriptionAr: 'مطبخ إيطالي أصيل في قلب القاهرة',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'PREMIUM',
      monthlyFee: 500,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  console.log(`✅ Restaurant created: ${restaurant.businessName}`)

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
      createdById: superAdmin.id
    }
  })

  console.log('✅ Admin user created')

  // Create categories
  const pastaCategory = await prisma.category.create({
    data: {
      tenantId: restaurant.id,
      nameEn: 'Pasta',
      nameAr: 'معكرونة',
      descriptionEn: 'Handmade pasta dishes',
      descriptionAr: 'أطباق معكرونة مصنوعة يدوياً',
      sortOrder: 1,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  // Create products for pasta
  await prisma.product.create({
    data: {
      tenantId: restaurant.id,
      categoryId: pastaCategory.id,
      nameEn: 'Spaghetti Carbonara',
      nameAr: 'سباغيتي كاربونارا',
      descriptionEn: 'Classic Roman pasta with eggs, pecorino cheese, and black pepper',
      descriptionAr: 'معكرونة رومانية كلاسيكية مع بيض وجبن بيكورينو وفلفل أسود',
      basePrice: 150,
      calories: 450,
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: restaurant.id,
      categoryId: pastaCategory.id,
      nameEn: 'Penne Arrabbiata',
      nameAr: 'بيني أرابياتا',
      descriptionEn: 'Penne pasta in spicy tomato sauce',
      descriptionAr: 'معكرونة بيني في صلصة طماطم حارة',
      basePrice: 120,
      calories: 380,
      isActive: true,
      isFeatured: false,
      sortOrder: 2,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: restaurant.id,
      categoryId: pastaCategory.id,
      nameEn: 'Fettuccine Alfredo',
      nameAr: 'فيتوتشيني ألفريدو',
      descriptionEn: 'Creamy pasta with butter and parmesan',
      descriptionAr: 'معكرونة كريمية مع زبدة وجبن بارميزان',
      basePrice: 140,
      calories: 520,
      isActive: true,
      isFeatured: true,
      sortOrder: 3,
      createdById: superAdmin.id
    }
  })

  const pizzaCategory = await prisma.category.create({
    data: {
      tenantId: restaurant.id,
      nameEn: 'Pizza',
      nameAr: 'بيتزا',
      descriptionEn: 'Wood-fired authentic Italian pizzas',
      descriptionAr: 'بيتزا إيطالية أصلية مطهوة في الفرن',
      sortOrder: 2,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: restaurant.id,
      categoryId: pizzaCategory.id,
      nameEn: 'Margherita',
      nameAr: 'مارغريتا',
      descriptionEn: 'Tomato sauce, mozzarella, fresh basil',
      descriptionAr: 'صلصة طماطم، موتزاريلا، ريحان طازج',
      basePrice: 130,
      calories: 680,
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: restaurant.id,
      categoryId: pizzaCategory.id,
      nameEn: 'Quattro Formaggi',
      nameAr: 'أربع أجبان',
      descriptionEn: 'Four cheese pizza',
      descriptionAr: 'بيتزا بأربع أجبان',
      basePrice: 160,
      calories: 750,
      isActive: true,
      isFeatured: false,
      sortOrder: 2,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: restaurant.id,
      categoryId: pizzaCategory.id,
      nameEn: 'Pepperoni',
      nameAr: 'بيبروني',
      descriptionEn: 'Classic pepperoni pizza',
      descriptionAr: 'بيتزا بيبروني كلاسيكية',
      basePrice: 145,
      calories: 720,
      isActive: true,
      isFeatured: true,
      sortOrder: 3,
      createdById: superAdmin.id
    }
  })

  const dessertsCategory = await prisma.category.create({
    data: {
      tenantId: restaurant.id,
      nameEn: 'Desserts',
      nameAr: 'حلويات',
      descriptionEn: 'Traditional Italian desserts',
      descriptionAr: 'حلويات إيطالية تقليدية',
      sortOrder: 3,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: restaurant.id,
      categoryId: dessertsCategory.id,
      nameEn: 'Tiramisu',
      nameAr: 'تيراميسو',
      descriptionEn: 'Classic Italian dessert with coffee and mascarpone',
      descriptionAr: 'حلوى إيطالية كلاسيكية مع قهوة وماسكاربوني',
      basePrice: 80,
      calories: 450,
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: restaurant.id,
      categoryId: dessertsCategory.id,
      nameEn: 'Panna Cotta',
      nameAr: 'بانا كوتا',
      descriptionEn: 'Creamy Italian dessert with berry compote',
      descriptionAr: 'حلوى إيطالية كريمية مع مربى التوت',
      basePrice: 70,
      calories: 320,
      isActive: true,
      isFeatured: false,
      sortOrder: 2,
      createdById: superAdmin.id
    }
  })

  console.log('✅ Restaurant categories and products created\n')

  // ==================== CREATE COFFEE SHOP ====================
  console.log('☕ Creating Specialty Coffee Shop...')

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
      createdById: superAdmin.id
    }
  })

  console.log(`✅ Coffee shop created: ${coffeeShop.businessName}`)

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
      createdById: superAdmin.id
    }
  })

  console.log('✅ Admin user created')

  const espressoCategory = await prisma.category.create({
    data: {
      tenantId: coffeeShop.id,
      nameEn: 'Espresso Bar',
      nameAr: 'قهوة إسبريسو',
      descriptionEn: 'Classic espresso-based drinks',
      descriptionAr: 'مشروبات إسبريسو كلاسيكية',
      sortOrder: 1,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: espressoCategory.id,
      nameEn: 'Single Origin Espresso',
      nameAr: 'إسبريسو منشأ واحد',
      descriptionEn: 'Rich, full-bodied espresso',
      descriptionAr: 'إسبريسو غني ممتلئ الجسم',
      basePrice: 45,
      calories: 5,
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: espressoCategory.id,
      nameEn: 'Cappuccino',
      nameAr: 'كابتشينو',
      descriptionEn: 'Espresso with steamed milk and foam',
      descriptionAr: 'إسبريسو مع حليب مبخر ورغوة',
      basePrice: 50,
      calories: 120,
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: espressoCategory.id,
      nameEn: 'Flat White',
      nameAr: 'فلات وايت',
      descriptionEn: 'Double espresso with microfoam milk',
      descriptionAr: 'إسبريسو مزدوج مع حليب بالرغوة الدقيقة',
      basePrice: 55,
      calories: 130,
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: espressoCategory.id,
      nameEn: 'Latte',
      nameAr: 'لاتيه',
      descriptionEn: 'Espresso with steamed milk',
      descriptionAr: 'إسبريسو مع حليب مبخر',
      basePrice: 52,
      calories: 150,
      isActive: true,
      isFeatured: true,
      sortOrder: 4,
      createdById: superAdmin.id
    }
  })

  const brewedCategory = await prisma.category.create({
    data: {
      tenantId: coffeeShop.id,
      nameEn: 'Brewed Coffee',
      nameAr: 'قهوة مخمرة',
      descriptionEn: 'Pour over and filter coffee',
      descriptionAr: 'قهوة منسكبة ومفلترة',
      sortOrder: 2,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: brewedCategory.id,
      nameEn: 'V60 Pour Over',
      nameAr: 'في60 صب',
      descriptionEn: 'Hand-poured single-origin coffee',
      descriptionAr: 'قهوة منشأ واحد مسكوبة يدوياً',
      basePrice: 60,
      calories: 5,
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: brewedCategory.id,
      nameEn: 'Cold Brew',
      nameAr: 'قهوة باردة',
      descriptionEn: 'Smooth, low-acid coffee steeped for 18 hours',
      descriptionAr: 'قهوة ناعمة قليلة الحموضة منقوعة لمدة 18 ساعة',
      basePrice: 58,
      calories: 10,
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      createdById: superAdmin.id
    }
  })

  const pastriesCategory = await prisma.category.create({
    data: {
      tenantId: coffeeShop.id,
      nameEn: 'Pastries & Treats',
      nameAr: 'معجنات وحلويات',
      descriptionEn: 'Freshly baked daily',
      descriptionAr: 'مخبوزة طازجة يومياً',
      sortOrder: 3,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: pastriesCategory.id,
      nameEn: 'Croissant',
      nameAr: 'كرواسون',
      descriptionEn: 'Buttery French croissant',
      descriptionAr: 'كرواسون فرنسي بالزبدة',
      basePrice: 35,
      calories: 230,
      isActive: true,
      isFeatured: false,
      sortOrder: 1,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: pastriesCategory.id,
      nameEn: 'Chocolate Muffin',
      nameAr: 'مافن بالشوكولاتة',
      descriptionEn: 'Rich chocolate muffin',
      descriptionAr: 'مافن شوكولاتة غني',
      basePrice: 30,
      calories: 380,
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: pastriesCategory.id,
      nameEn: 'Almond Biscotti',
      nameAr: 'بسكوتي باللوز',
      descriptionEn: 'Crunchy Italian almond cookie',
      descriptionAr: 'بسكويت إيطالي باللوز مقرمش',
      basePrice: 25,
      calories: 150,
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
      createdById: superAdmin.id
    }
  })

  const specialtyCategory = await prisma.category.create({
    data: {
      tenantId: coffeeShop.id,
      nameEn: 'Specialty Drinks',
      nameAr: 'مشروبات مميزة',
      descriptionEn: 'Unique seasonal creations',
      descriptionAr: 'إبداعات موسمية فريدة',
      sortOrder: 4,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: specialtyCategory.id,
      nameEn: 'Honey Lavender Latte',
      nameAr: 'لاتيه بالعسل والخزامى',
      descriptionEn: 'Latte with honey and lavender',
      descriptionAr: 'لاتيه مع عسل وشراب الخزامى',
      basePrice: 65,
      calories: 180,
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
      createdById: superAdmin.id
    }
  })

  await prisma.product.create({
    data: {
      tenantId: coffeeShop.id,
      categoryId: specialtyCategory.id,
      nameEn: 'Cardamom Cappuccino',
      nameAr: 'كابتشينو بالهيل',
      descriptionEn: 'Cappuccino infused with cardamom',
      descriptionAr: 'كابتشينو مع هيل عطري',
      basePrice: 58,
      calories: 125,
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
      createdById: superAdmin.id
    }
  })

  console.log('✅ Coffee shop categories and products created\n')

  console.log('🎉 Demo menus created successfully!\n')
  console.log('📋 Summary:')
  console.log('   • Bella Italia (Restaurant)')
  console.log('     - Login: admin@bellaitalia.com / 123456')
  console.log('     - Dashboard: https://themenugenie.com/tenant/bella-italia/dashboard')
  console.log('     - Menu: https://themenugenie.com/menu/bella-italia')
  console.log('     - 3 categories, 8 products\n')
  console.log('   • Artisan Brew Coffee (Cafe)')
  console.log('     - Login: admin@artisanbrew.com / 123456')
  console.log('     - Dashboard: https://themenugenie.com/tenant/artisan-brew/dashboard')
  console.log('     - Menu: https://themenugenie.com/menu/artisan-brew')
  console.log('     - 4 categories, 11 products\n')
  console.log('✨ Both menus are now live on the homepage!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
