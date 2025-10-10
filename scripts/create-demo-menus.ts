import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎬 Starting demo menus creation...\n')

  // Get the super admin user who will own these tenants
  const superAdmin = await prisma.user.findFirst({
    where: {
      role: 'SUPER_ADMIN'
    }
  })

  if (!superAdmin) {
    throw new Error('No super admin found. Please create a super admin first.')
  }

  console.log(`✅ Found super admin: ${superAdmin.email}`)

  // Get business types
  const restaurantType = await prisma.businessType.findFirst({
    where: { nameEn: 'Restaurant' }
  })

  const cafeType = await prisma.businessType.findFirst({
    where: { nameEn: 'Cafe' }
  })

  if (!restaurantType || !cafeType) {
    throw new Error('Business types not found. Please seed the database first.')
  }

  console.log('✅ Found business types\n')

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
      defaultLanguage: 'en',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      primaryColor: '#D32F2F',
      secondaryColor: '#388E3C',
      accentColor: '#FBC02D',
      description: 'Authentic Italian cuisine in the heart of Cairo. Experience the taste of Italy with our traditional recipes and fresh ingredients.',
      descriptionAr: 'مطبخ إيطالي أصيل في قلب القاهرة. اختبر طعم إيطاليا مع وصفاتنا التقليدية والمكونات الطازجة.',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'PREMIUM',
      monthlyFee: 500,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  console.log(`✅ Restaurant created: ${restaurant.businessName}`)

  // Create admin user for restaurant
  const restaurantUser = await prisma.user.create({
    data: {
      email: 'admin@bellaitalia.com',
      password: '$2a$10$xHhUvJFYvKZ9qKGVZDNqKe8T7vJk6YqKjKj4F0vRGZNqKjKj4F0vR', // hashed: "123456"
      role: 'ADMIN',
      mustChangePassword: false
    }
  })

  await prisma.tenantUser.create({
    data: {
      userId: restaurantUser.id,
      tenantId: restaurant.id,
      role: 'ADMIN',
      displayName: 'Marco Rossi',
      displayNameAr: 'ماركو روسي'
    }
  })

  console.log('✅ Admin user created for restaurant')

  // Create categories and products for restaurant
  const pastaCategory = await prisma.category.create({
    data: {
      tenantId: restaurant.id,
      nameEn: 'Pasta',
      nameAr: 'معكرونة',
      descriptionEn: 'Handmade pasta dishes',
      descriptionAr: 'أطباق معكرونة مصنوعة يدوياً',
      displayOrder: 1,
      isActive: true
    }
  })

  await prisma.product.createMany({
    data: [
      {
        tenantId: restaurant.id,
        categoryId: pastaCategory.id,
        nameEn: 'Spaghetti Carbonara',
        nameAr: 'سباغيتي كاربونارا',
        descriptionEn: 'Classic Roman pasta with eggs, pecorino cheese, guanciale, and black pepper',
        descriptionAr: 'معكرونة رومانية كلاسيكية مع بيض، جبن بيكورينو، لحم الخنزير، وفلفل أسود',
        price: 150,
        calories: 450,
        imageUrl: '/images/demo/carbonara.jpg',
        isActive: true,
        isFeatured: true,
        displayOrder: 1
      },
      {
        tenantId: restaurant.id,
        categoryId: pastaCategory.id,
        nameEn: 'Penne Arrabbiata',
        nameAr: 'بيني أرابياتا',
        descriptionEn: 'Penne pasta in spicy tomato sauce with garlic and red chili peppers',
        descriptionAr: 'معكرونة بيني في صلصة طماطم حارة مع ثوم وفلفل أحمر حار',
        price: 120,
        calories: 380,
        isActive: true,
        isFeatured: false,
        displayOrder: 2
      },
      {
        tenantId: restaurant.id,
        categoryId: pastaCategory.id,
        nameEn: 'Fettuccine Alfredo',
        nameAr: 'فيتوتشيني ألفريدو',
        descriptionEn: 'Creamy pasta with butter and parmesan cheese',
        descriptionAr: 'معكرونة كريمية مع زبدة وجبن بارميزان',
        price: 140,
        calories: 520,
        isActive: true,
        isFeatured: true,
        displayOrder: 3
      }
    ]
  })

  const pizzaCategory = await prisma.category.create({
    data: {
      tenantId: restaurant.id,
      nameEn: 'Pizza',
      nameAr: 'بيتزا',
      descriptionEn: 'Wood-fired authentic Italian pizzas',
      descriptionAr: 'بيتزا إيطالية أصلية مطهوة في الفرن',
      displayOrder: 2,
      isActive: true
    }
  })

  await prisma.product.createMany({
    data: [
      {
        tenantId: restaurant.id,
        categoryId: pizzaCategory.id,
        nameEn: 'Margherita',
        nameAr: 'مارغريتا',
        descriptionEn: 'Tomato sauce, mozzarella, fresh basil, and olive oil',
        descriptionAr: 'صلصة طماطم، موتزاريلا، ريحان طازج، وزيت زيتون',
        price: 130,
        calories: 680,
        isActive: true,
        isFeatured: true,
        displayOrder: 1
      },
      {
        tenantId: restaurant.id,
        categoryId: pizzaCategory.id,
        nameEn: 'Quattro Formaggi',
        nameAr: 'أربع أجبان',
        descriptionEn: 'Four cheese pizza: mozzarella, gorgonzola, parmesan, and ricotta',
        descriptionAr: 'بيتزا بأربع أجبان: موتزاريلا، جورجونزولا، بارميزان، وريكوتا',
        price: 160,
        calories: 750,
        isActive: true,
        isFeatured: false,
        displayOrder: 2
      },
      {
        tenantId: restaurant.id,
        categoryId: pizzaCategory.id,
        nameEn: 'Pepperoni',
        nameAr: 'بيبروني',
        descriptionEn: 'Classic pepperoni pizza with mozzarella and tomato sauce',
        descriptionAr: 'بيتزا بيبروني كلاسيكية مع موتزاريلا وصلصة طماطم',
        price: 145,
        calories: 720,
        isActive: true,
        isFeatured: true,
        displayOrder: 3
      }
    ]
  })

  const dessertsCategory = await prisma.category.create({
    data: {
      tenantId: restaurant.id,
      nameEn: 'Desserts',
      nameAr: 'حلويات',
      descriptionEn: 'Traditional Italian desserts',
      descriptionAr: 'حلويات إيطالية تقليدية',
      displayOrder: 3,
      isActive: true
    }
  })

  await prisma.product.createMany({
    data: [
      {
        tenantId: restaurant.id,
        categoryId: dessertsCategory.id,
        nameEn: 'Tiramisu',
        nameAr: 'تيراميسو',
        descriptionEn: 'Classic Italian dessert with coffee, mascarpone, and cocoa',
        descriptionAr: 'حلوى إيطالية كلاسيكية مع قهوة، ماسكاربوني، وكاكاو',
        price: 80,
        calories: 450,
        isActive: true,
        isFeatured: true,
        displayOrder: 1
      },
      {
        tenantId: restaurant.id,
        categoryId: dessertsCategory.id,
        nameEn: 'Panna Cotta',
        nameAr: 'بانا كوتا',
        descriptionEn: 'Creamy Italian dessert with berry compote',
        descriptionAr: 'حلوى إيطالية كريمية مع مربى التوت',
        price: 70,
        calories: 320,
        isActive: true,
        isFeatured: false,
        displayOrder: 2
      }
    ]
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
      address: '42 Zamalek Street, Zamalek, Cairo',
      addressAr: '42 شارع الزمالك، الزمالك، القاهرة',
      ownerName: 'Sarah Ahmed',
      ownerEmail: 'admin@artisanbrew.com',
      ownerPhone: '+20 111 234 5678',
      subdomain: 'artisanbrew',
      defaultLanguage: 'en',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      primaryColor: '#6F4E37',
      secondaryColor: '#D4A574',
      accentColor: '#2C1810',
      description: 'Specialty coffee roasted in-house. We source the finest beans from around the world and craft each cup with precision and care.',
      descriptionAr: 'قهوة مختصة محمصة محلياً. نحن نحصل على أجود حبوب البن من جميع أنحاء العالم ونصنع كل كوب بدقة وعناية.',
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'PREMIUM',
      monthlyFee: 500,
      isActive: true,
      createdById: superAdmin.id
    }
  })

  console.log(`✅ Coffee shop created: ${coffeeShop.businessName}`)

  // Create admin user for coffee shop
  const coffeeShopUser = await prisma.user.create({
    data: {
      email: 'admin@artisanbrew.com',
      password: '$2a$10$xHhUvJFYvKZ9qKGVZDNqKe8T7vJk6YqKjKj4F0vRGZNqKjKj4F0vR', // hashed: "123456"
      role: 'ADMIN',
      mustChangePassword: false
    }
  })

  await prisma.tenantUser.create({
    data: {
      userId: coffeeShopUser.id,
      tenantId: coffeeShop.id,
      role: 'ADMIN',
      displayName: 'Sarah Ahmed',
      displayNameAr: 'سارة أحمد'
    }
  })

  console.log('✅ Admin user created for coffee shop')

  // Create categories and products for coffee shop
  const espressoCategory = await prisma.category.create({
    data: {
      tenantId: coffeeShop.id,
      nameEn: 'Espresso Bar',
      nameAr: 'قهوة إسبريسو',
      descriptionEn: 'Classic espresso-based drinks',
      descriptionAr: 'مشروبات إسبريسو كلاسيكية',
      displayOrder: 1,
      isActive: true
    }
  })

  await prisma.product.createMany({
    data: [
      {
        tenantId: coffeeShop.id,
        categoryId: espressoCategory.id,
        nameEn: 'Single Origin Espresso',
        nameAr: 'إسبريسو منشأ واحد',
        descriptionEn: 'Rich, full-bodied espresso from our single-origin Ethiopian beans',
        descriptionAr: 'إسبريسو غني ممتلئ الجسم من حبوب البن الإثيوبية ذات المنشأ الواحد',
        price: 45,
        calories: 5,
        isActive: true,
        isFeatured: true,
        displayOrder: 1
      },
      {
        tenantId: coffeeShop.id,
        categoryId: espressoCategory.id,
        nameEn: 'Cappuccino',
        nameAr: 'كابتشينو',
        descriptionEn: 'Espresso with steamed milk and velvety foam',
        descriptionAr: 'إسبريسو مع حليب مبخر ورغوة حريرية',
        price: 50,
        calories: 120,
        isActive: true,
        isFeatured: true,
        displayOrder: 2
      },
      {
        tenantId: coffeeShop.id,
        categoryId: espressoCategory.id,
        nameEn: 'Flat White',
        nameAr: 'فلات وايت',
        descriptionEn: 'Double espresso with microfoam milk',
        descriptionAr: 'إسبريسو مزدوج مع حليب بالرغوة الدقيقة',
        price: 55,
        calories: 130,
        isActive: true,
        isFeatured: false,
        displayOrder: 3
      },
      {
        tenantId: coffeeShop.id,
        categoryId: espressoCategory.id,
        nameEn: 'Latte',
        nameAr: 'لاتيه',
        descriptionEn: 'Espresso with steamed milk and light foam',
        descriptionAr: 'إسبريسو مع حليب مبخر ورغوة خفيفة',
        price: 52,
        calories: 150,
        isActive: true,
        isFeatured: true,
        displayOrder: 4
      }
    ]
  })

  const brewedCategory = await prisma.category.create({
    data: {
      tenantId: coffeeShop.id,
      nameEn: 'Brewed Coffee',
      nameAr: 'قهوة مخمرة',
      descriptionEn: 'Pour over and filter coffee',
      descriptionAr: 'قهوة منسكبة ومفلترة',
      displayOrder: 2,
      isActive: true
    }
  })

  await prisma.product.createMany({
    data: [
      {
        tenantId: coffeeShop.id,
        categoryId: brewedCategory.id,
        nameEn: 'V60 Pour Over',
        nameAr: 'في60 صب',
        descriptionEn: 'Hand-poured single-origin coffee highlighting natural flavors',
        descriptionAr: 'قهوة منشأ واحد مسكوبة يدوياً تبرز النكهات الطبيعية',
        price: 60,
        calories: 5,
        isActive: true,
        isFeatured: true,
        displayOrder: 1
      },
      {
        tenantId: coffeeShop.id,
        categoryId: brewedCategory.id,
        nameEn: 'Chemex',
        nameAr: 'كيمكس',
        descriptionEn: 'Clean, bright coffee brewed in our signature Chemex',
        descriptionAr: 'قهوة نظيفة ومشرقة مخمرة في كيمكس المميز لدينا',
        price: 65,
        calories: 5,
        isActive: true,
        isFeatured: false,
        displayOrder: 2
      },
      {
        tenantId: coffeeShop.id,
        categoryId: brewedCategory.id,
        nameEn: 'Cold Brew',
        nameAr: 'قهوة باردة',
        descriptionEn: 'Smooth, low-acid coffee steeped for 18 hours',
        descriptionAr: 'قهوة ناعمة قليلة الحموضة منقوعة لمدة 18 ساعة',
        price: 58,
        calories: 10,
        isActive: true,
        isFeatured: true,
        displayOrder: 3
      }
    ]
  })

  const pastriesCategory = await prisma.category.create({
    data: {
      tenantId: coffeeShop.id,
      nameEn: 'Pastries & Treats',
      nameAr: 'معجنات وحلويات',
      descriptionEn: 'Freshly baked daily',
      descriptionAr: 'مخبوزة طازجة يومياً',
      displayOrder: 3,
      isActive: true
    }
  })

  await prisma.product.createMany({
    data: [
      {
        tenantId: coffeeShop.id,
        categoryId: pastriesCategory.id,
        nameEn: 'Croissant',
        nameAr: 'كرواسون',
        descriptionEn: 'Buttery French croissant, baked fresh every morning',
        descriptionAr: 'كرواسون فرنسي بالزبدة، مخبوز طازج كل صباح',
        price: 35,
        calories: 230,
        isActive: true,
        isFeatured: false,
        displayOrder: 1
      },
      {
        tenantId: coffeeShop.id,
        categoryId: pastriesCategory.id,
        nameEn: 'Chocolate Muffin',
        nameAr: 'مافن بالشوكولاتة',
        descriptionEn: 'Rich chocolate muffin with chocolate chips',
        descriptionAr: 'مافن شوكولاتة غني برقائق الشوكولاتة',
        price: 30,
        calories: 380,
        isActive: true,
        isFeatured: true,
        displayOrder: 2
      },
      {
        tenantId: coffeeShop.id,
        categoryId: pastriesCategory.id,
        nameEn: 'Almond Biscotti',
        nameAr: 'بسكوتي باللوز',
        descriptionEn: 'Crunchy Italian almond cookie, perfect with coffee',
        descriptionAr: 'بسكويت إيطالي باللوز مقرمش، مثالي مع القهوة',
        price: 25,
        calories: 150,
        isActive: true,
        isFeatured: false,
        displayOrder: 3
      }
    ]
  })

  const specialtyCategory = await prisma.category.create({
    data: {
      tenantId: coffeeShop.id,
      nameEn: 'Specialty Drinks',
      nameAr: 'مشروبات مميزة',
      descriptionEn: 'Unique seasonal creations',
      descriptionAr: 'إبداعات موسمية فريدة',
      displayOrder: 4,
      isActive: true
    }
  })

  await prisma.product.createMany({
    data: [
      {
        tenantId: coffeeShop.id,
        categoryId: specialtyCategory.id,
        nameEn: 'Honey Lavender Latte',
        nameAr: 'لاتيه بالعسل والخزامى',
        descriptionEn: 'Espresso with steamed milk, honey, and lavender syrup',
        descriptionAr: 'إسبريسو مع حليب مبخر، عسل، وشراب الخزامى',
        price: 65,
        calories: 180,
        isActive: true,
        isFeatured: true,
        displayOrder: 1
      },
      {
        tenantId: coffeeShop.id,
        categoryId: specialtyCategory.id,
        nameEn: 'Cardamom Cappuccino',
        nameAr: 'كابتشينو بالهيل',
        descriptionEn: 'Traditional cappuccino infused with aromatic cardamom',
        descriptionAr: 'كابتشينو تقليدي مع هيل عطري',
        price: 58,
        calories: 125,
        isActive: true,
        isFeatured: true,
        displayOrder: 2
      }
    ]
  })

  console.log('✅ Coffee shop categories and products created\n')

  console.log('🎉 Demo menus created successfully!')
  console.log('\n📋 Summary:')
  console.log('   • Bella Italia (Restaurant)')
  console.log('     - Login: admin@bellaitalia.com / 123456')
  console.log('     - Dashboard: themenugenie.com/tenant/bella-italia/dashboard')
  console.log('     - Menu: themenugenie.com/menu/bella-italia')
  console.log('     - 3 categories, 10 products')
  console.log('\n   • Artisan Brew Coffee (Cafe)')
  console.log('     - Login: admin@artisanbrew.com / 123456')
  console.log('     - Dashboard: themenugenie.com/tenant/artisan-brew/dashboard')
  console.log('     - Menu: themenugenie.com/menu/artisan-brew')
  console.log('     - 4 categories, 14 products')
  console.log('\n✨ Both menus are now live on the homepage!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
