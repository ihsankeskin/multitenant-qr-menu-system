const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })
}

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Deleting Waseem tenant...')
  
  // Delete Waseem tenant and all related data
  try {
    const waseemTenant = await prisma.tenant.findUnique({
      where: { slug: 'waseemco' }
    })

    if (waseemTenant) {
      // Delete all related data (Prisma will handle cascade)
      await prisma.tenant.delete({
        where: { slug: 'waseemco' }
      })
      console.log('✅ Waseem tenant deleted successfully')
    } else {
      console.log('ℹ️  Waseem tenant not found')
    }
  } catch (error) {
    console.error('Error deleting Waseem tenant:', error.message)
  }

  console.log('\n🍽️  Creating Demo Restaurant Menu...')
  
  // Create Full Restaurant (Italian Cuisine)
  const restaurant = await prisma.tenant.create({
    data: {
      businessName: 'La Bella Italia',
      slug: 'labellaitalia',
      subdomain: 'labellaitalia',
      email: 'info@labellaitalia.com',
      phone: '+1234567890',
      address: '123 Italian Street, Food City',
      primaryColor: '#D32F2F',
      secondaryColor: '#F44336',
      accentColor: '#FF5252',
      logoUrl: '/logo.jpg',
      isActive: true,
      defaultLanguage: 'en'
    }
  })

  // Create admin for restaurant
  const hashedPassword = await bcrypt.hash('123456', 10)
  await prisma.user.create({
    data: {
      name: 'Restaurant Admin',
      email: 'admin@labellaitalia.com',
      password: hashedPassword,
      role: 'tenant_admin',
      tenantId: restaurant.id
    }
  })

  // Restaurant Categories and Products
  const appetizers = await prisma.category.create({
    data: {
      nameEn: 'Appetizers',
      nameAr: 'المقبلات',
      descriptionEn: 'Start your meal with our delicious appetizers',
      descriptionAr: 'ابدأ وجبتك مع مقبلاتنا اللذيذة',
      displayOrder: 1,
      isActive: true,
      tenantId: restaurant.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Bruschetta',
        nameAr: 'بروشيتا',
        descriptionEn: 'Grilled bread topped with fresh tomatoes, garlic, basil, and olive oil',
        descriptionAr: 'خبز محمص مع الطماطم الطازجة والثوم والريحان وزيت الزيتون',
        price: 8.99,
        calories: 180,
        isActive: true,
        isFeatured: true,
        categoryId: appetizers.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Caprese Salad',
        nameAr: 'سلطة كابريزي',
        descriptionEn: 'Fresh mozzarella, tomatoes, and basil drizzled with balsamic glaze',
        descriptionAr: 'جبن موزاريلا طازج مع الطماطم والريحان وصلصة بلسميك',
        price: 10.99,
        calories: 220,
        isActive: true,
        isFeatured: true,
        categoryId: appetizers.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Calamari Fritti',
        nameAr: 'كاليماري مقلي',
        descriptionEn: 'Crispy fried calamari served with marinara sauce',
        descriptionAr: 'حبار مقلي مقرمش يقدم مع صلصة مارينارا',
        price: 12.99,
        calories: 340,
        isActive: true,
        categoryId: appetizers.id,
        tenantId: restaurant.id
      }
    ]
  })

  const pasta = await prisma.category.create({
    data: {
      nameEn: 'Pasta',
      nameAr: 'المعكرونة',
      descriptionEn: 'Authentic Italian pasta dishes made fresh daily',
      descriptionAr: 'أطباق معكرونة إيطالية أصيلة طازجة يومياً',
      displayOrder: 2,
      isActive: true,
      tenantId: restaurant.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Spaghetti Carbonara',
        nameAr: 'سباغيتي كاربونارا',
        descriptionEn: 'Classic pasta with pancetta, eggs, parmesan, and black pepper',
        descriptionAr: 'معكرونة كلاسيكية مع لحم الخنزير والبيض والبارميزان والفلفل الأسود',
        price: 16.99,
        calories: 520,
        isActive: true,
        isFeatured: true,
        categoryId: pasta.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Fettuccine Alfredo',
        nameAr: 'فيتوتشيني ألفريدو',
        descriptionEn: 'Creamy parmesan sauce with butter and garlic',
        descriptionAr: 'صلصة بارميزان كريمية مع الزبدة والثوم',
        price: 15.99,
        calories: 580,
        isActive: true,
        categoryId: pasta.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Penne Arrabbiata',
        nameAr: 'بيني أرابياتا',
        descriptionEn: 'Spicy tomato sauce with garlic and red chili peppers',
        descriptionAr: 'صلصة طماطم حارة مع الثوم والفلفل الأحمر الحار',
        price: 14.99,
        calories: 450,
        isActive: true,
        categoryId: pasta.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Lasagna Bolognese',
        nameAr: 'لازانيا بولونيز',
        descriptionEn: 'Layers of pasta with meat sauce, bechamel, and mozzarella',
        descriptionAr: 'طبقات من المعكرونة مع صلصة اللحم والبشاميل والموزاريلا',
        price: 18.99,
        calories: 650,
        isActive: true,
        categoryId: pasta.id,
        tenantId: restaurant.id
      }
    ]
  })

  const pizza = await prisma.category.create({
    data: {
      nameEn: 'Pizza',
      nameAr: 'البيتزا',
      descriptionEn: 'Wood-fired pizzas with the finest ingredients',
      descriptionAr: 'بيتزا مطبوخة في فرن الحطب مع أفضل المكونات',
      displayOrder: 3,
      isActive: true,
      tenantId: restaurant.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Margherita',
        nameAr: 'مارغريتا',
        descriptionEn: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
        descriptionAr: 'بيتزا كلاسيكية مع صلصة الطماطم والموزاريلا والريحان الطازج',
        price: 13.99,
        calories: 720,
        isActive: true,
        isFeatured: true,
        categoryId: pizza.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Quattro Formaggi',
        nameAr: 'كواترو فورماجي',
        descriptionEn: 'Four cheese pizza: mozzarella, gorgonzola, parmesan, fontina',
        descriptionAr: 'بيتزا أربعة أنواع من الجبن: موزاريلا، جورجونزولا، بارميزان، فونتينا',
        price: 16.99,
        calories: 820,
        isActive: true,
        categoryId: pizza.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Diavola',
        nameAr: 'ديافولا',
        descriptionEn: 'Spicy salami, mozzarella, tomato sauce, and chili oil',
        descriptionAr: 'سلامي حار، موزاريلا، صلصة طماطم، وزيت الفلفل الحار',
        price: 15.99,
        calories: 780,
        isActive: true,
        categoryId: pizza.id,
        tenantId: restaurant.id
      }
    ]
  })

  const mains = await prisma.category.create({
    data: {
      nameEn: 'Main Courses',
      nameAr: 'الأطباق الرئيسية',
      descriptionEn: 'Hearty Italian main dishes',
      descriptionAr: 'أطباق إيطالية رئيسية شهية',
      displayOrder: 4,
      isActive: true,
      tenantId: restaurant.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Osso Buco',
        nameAr: 'أوسو بوكو',
        descriptionEn: 'Braised veal shanks with vegetables and white wine',
        descriptionAr: 'لحم عجل مطهو ببطء مع الخضروات والنبيذ الأبيض',
        price: 28.99,
        calories: 680,
        isActive: true,
        isFeatured: true,
        categoryId: mains.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Chicken Parmigiana',
        nameAr: 'دجاج بارميزان',
        descriptionEn: 'Breaded chicken breast with marinara sauce and melted mozzarella',
        descriptionAr: 'صدر دجاج مقرمش مع صلصة مارينارا وجبن موزاريلا ذائب',
        price: 22.99,
        calories: 620,
        isActive: true,
        categoryId: mains.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Grilled Salmon',
        nameAr: 'سلمون مشوي',
        descriptionEn: 'Fresh Atlantic salmon with lemon butter sauce and vegetables',
        descriptionAr: 'سلمون أطلسي طازج مع صلصة الزبدة والليمون والخضروات',
        price: 26.99,
        calories: 540,
        isActive: true,
        categoryId: mains.id,
        tenantId: restaurant.id
      }
    ]
  })

  const desserts = await prisma.category.create({
    data: {
      nameEn: 'Desserts',
      nameAr: 'الحلويات',
      descriptionEn: 'Sweet endings to your perfect meal',
      descriptionAr: 'نهاية حلوة لوجبتك المثالية',
      displayOrder: 5,
      isActive: true,
      tenantId: restaurant.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Tiramisu',
        nameAr: 'تيراميسو',
        descriptionEn: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
        descriptionAr: 'حلوى إيطالية كلاسيكية مع البسكويت المنقوع بالقهوة والماسكاربوني',
        price: 8.99,
        calories: 450,
        isActive: true,
        isFeatured: true,
        categoryId: desserts.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Panna Cotta',
        nameAr: 'بانا كوتا',
        descriptionEn: 'Silky Italian custard with berry compote',
        descriptionAr: 'كاسترد إيطالي حريري مع كومبوت التوت',
        price: 7.99,
        calories: 320,
        isActive: true,
        categoryId: desserts.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Cannoli',
        nameAr: 'كانولي',
        descriptionEn: 'Crispy pastry shells filled with sweet ricotta cream',
        descriptionAr: 'معجنات مقرمشة محشوة بكريمة الريكوتا الحلوة',
        price: 6.99,
        calories: 380,
        isActive: true,
        categoryId: desserts.id,
        tenantId: restaurant.id
      }
    ]
  })

  const beverages = await prisma.category.create({
    data: {
      nameEn: 'Beverages',
      nameAr: 'المشروبات',
      descriptionEn: 'Refreshing drinks to complement your meal',
      descriptionAr: 'مشروبات منعشة لتكمل وجبتك',
      displayOrder: 6,
      isActive: true,
      tenantId: restaurant.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Italian Soda',
        nameAr: 'صودا إيطالية',
        descriptionEn: 'Sparkling water with flavored syrup',
        descriptionAr: 'ماء فوار مع شراب بنكهات مختلفة',
        price: 4.99,
        calories: 120,
        isActive: true,
        categoryId: beverages.id,
        tenantId: restaurant.id
      },
      {
        nameEn: 'Fresh Lemonade',
        nameAr: 'عصير ليمون طازج',
        descriptionEn: 'Freshly squeezed lemon juice with mint',
        descriptionAr: 'عصير ليمون طازج مع النعناع',
        price: 4.99,
        calories: 90,
        isActive: true,
        categoryId: beverages.id,
        tenantId: restaurant.id
      }
    ]
  })

  console.log('✅ Restaurant menu created successfully')

  console.log('\n☕ Creating Demo Coffee Shop Menu...')

  // Create Coffee Shop
  const coffeeShop = await prisma.tenant.create({
    data: {
      businessName: 'Café Aroma',
      slug: 'cafearoma',
      subdomain: 'cafearoma',
      email: 'hello@cafearoma.com',
      phone: '+1987654321',
      address: '456 Coffee Lane, Brew City',
      primaryColor: '#6F4E37',
      secondaryColor: '#8B4513',
      accentColor: '#A0522D',
      logoUrl: '/logo.jpg',
      isActive: true,
      defaultLanguage: 'en'
    }
  })

  // Create admin for coffee shop
  await prisma.user.create({
    data: {
      name: 'Cafe Admin',
      email: 'admin@cafearoma.com',
      password: hashedPassword,
      role: 'tenant_admin',
      tenantId: coffeeShop.id
    }
  })

  // Coffee Categories and Products
  const hotCoffee = await prisma.category.create({
    data: {
      nameEn: 'Hot Coffee',
      nameAr: 'القهوة الساخنة',
      descriptionEn: 'Freshly brewed hot coffee drinks',
      descriptionAr: 'مشروبات قهوة ساخنة طازجة',
      displayOrder: 1,
      isActive: true,
      tenantId: coffeeShop.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Espresso',
        nameAr: 'إسبريسو',
        descriptionEn: 'Rich and bold Italian espresso shot',
        descriptionAr: 'قهوة إسبريسو إيطالية غنية وقوية',
        price: 3.99,
        calories: 5,
        isActive: true,
        isFeatured: true,
        categoryId: hotCoffee.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Americano',
        nameAr: 'أمريكانو',
        descriptionEn: 'Espresso with hot water for a smooth taste',
        descriptionAr: 'إسبريسو مع ماء ساخن لطعم ناعم',
        price: 4.49,
        calories: 10,
        isActive: true,
        categoryId: hotCoffee.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Cappuccino',
        nameAr: 'كابتشينو',
        descriptionEn: 'Espresso with steamed milk and foam',
        descriptionAr: 'إسبريسو مع حليب مبخر ورغوة',
        price: 5.49,
        calories: 120,
        isActive: true,
        isFeatured: true,
        categoryId: hotCoffee.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Latte',
        nameAr: 'لاتيه',
        descriptionEn: 'Espresso with steamed milk and light foam',
        descriptionAr: 'إسبريسو مع حليب مبخر ورغوة خفيفة',
        price: 5.99,
        calories: 150,
        isActive: true,
        isFeatured: true,
        categoryId: hotCoffee.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Mocha',
        nameAr: 'موكا',
        descriptionEn: 'Espresso with chocolate, steamed milk, and whipped cream',
        descriptionAr: 'إسبريسو مع شوكولاتة وحليب مبخر وكريمة مخفوقة',
        price: 6.49,
        calories: 290,
        isActive: true,
        categoryId: hotCoffee.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Flat White',
        nameAr: 'فلات وايت',
        descriptionEn: 'Espresso with velvety microfoam milk',
        descriptionAr: 'إسبريسو مع حليب ناعم كالحرير',
        price: 5.99,
        calories: 130,
        isActive: true,
        categoryId: hotCoffee.id,
        tenantId: coffeeShop.id
      }
    ]
  })

  const coldCoffee = await prisma.category.create({
    data: {
      nameEn: 'Iced Coffee',
      nameAr: 'القهوة المثلجة',
      descriptionEn: 'Refreshing cold coffee beverages',
      descriptionAr: 'مشروبات قهوة باردة منعشة',
      displayOrder: 2,
      isActive: true,
      tenantId: coffeeShop.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Iced Latte',
        nameAr: 'لاتيه مثلج',
        descriptionEn: 'Espresso with cold milk over ice',
        descriptionAr: 'إسبريسو مع حليب بارد على الثلج',
        price: 6.49,
        calories: 140,
        isActive: true,
        isFeatured: true,
        categoryId: coldCoffee.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Cold Brew',
        nameAr: 'كولد برو',
        descriptionEn: 'Smooth coffee steeped for 24 hours',
        descriptionAr: 'قهوة ناعمة منقوعة لمدة 24 ساعة',
        price: 5.99,
        calories: 5,
        isActive: true,
        isFeatured: true,
        categoryId: coldCoffee.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Iced Americano',
        nameAr: 'أمريكانو مثلج',
        descriptionEn: 'Espresso with cold water over ice',
        descriptionAr: 'إسبريسو مع ماء بارد على الثلج',
        price: 4.99,
        calories: 10,
        isActive: true,
        categoryId: coldCoffee.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Iced Mocha',
        nameAr: 'موكا مثلج',
        descriptionEn: 'Espresso with chocolate and cold milk over ice',
        descriptionAr: 'إسبريسو مع شوكولاتة وحليب بارد على الثلج',
        price: 6.99,
        calories: 280,
        isActive: true,
        categoryId: coldCoffee.id,
        tenantId: coffeeShop.id
      }
    ]
  })

  const specialty = await prisma.category.create({
    data: {
      nameEn: 'Specialty Drinks',
      nameAr: 'المشروبات الخاصة',
      descriptionEn: 'Unique signature beverages',
      descriptionAr: 'مشروبات مميزة وفريدة',
      displayOrder: 3,
      isActive: true,
      tenantId: coffeeShop.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Caramel Macchiato',
        nameAr: 'كراميل ماكياتو',
        descriptionEn: 'Espresso with vanilla, steamed milk, and caramel drizzle',
        descriptionAr: 'إسبريسو مع فانيليا وحليب مبخر وصلصة كراميل',
        price: 6.99,
        calories: 250,
        isActive: true,
        isFeatured: true,
        categoryId: specialty.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Hazelnut Latte',
        nameAr: 'لاتيه بالبندق',
        descriptionEn: 'Latte with hazelnut syrup',
        descriptionAr: 'لاتيه مع شراب البندق',
        price: 6.49,
        calories: 180,
        isActive: true,
        categoryId: specialty.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Vanilla Cappuccino',
        nameAr: 'كابتشينو بالفانيليا',
        descriptionEn: 'Cappuccino with vanilla syrup',
        descriptionAr: 'كابتشينو مع شراب الفانيليا',
        price: 5.99,
        calories: 150,
        isActive: true,
        categoryId: specialty.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Spanish Latte',
        nameAr: 'لاتيه إسباني',
        descriptionEn: 'Latte with condensed milk for extra sweetness',
        descriptionAr: 'لاتيه مع حليب مكثف محلى لحلاوة إضافية',
        price: 6.99,
        calories: 210,
        isActive: true,
        isFeatured: true,
        categoryId: specialty.id,
        tenantId: coffeeShop.id
      }
    ]
  })

  const tea = await prisma.category.create({
    data: {
      nameEn: 'Tea & More',
      nameAr: 'الشاي والمزيد',
      descriptionEn: 'Premium teas and hot beverages',
      descriptionAr: 'أنواع شاي فاخرة ومشروبات ساخنة',
      displayOrder: 4,
      isActive: true,
      tenantId: coffeeShop.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'English Breakfast Tea',
        nameAr: 'شاي الإفطار الإنجليزي',
        descriptionEn: 'Classic black tea blend',
        descriptionAr: 'مزيج الشاي الأسود الكلاسيكي',
        price: 3.99,
        calories: 2,
        isActive: true,
        categoryId: tea.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Green Tea',
        nameAr: 'شاي أخضر',
        descriptionEn: 'Antioxidant-rich green tea',
        descriptionAr: 'شاي أخضر غني بمضادات الأكسدة',
        price: 3.99,
        calories: 0,
        isActive: true,
        categoryId: tea.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Mint Tea',
        nameAr: 'شاي بالنعناع',
        descriptionEn: 'Refreshing peppermint tea',
        descriptionAr: 'شاي نعناع منعش',
        price: 3.99,
        calories: 0,
        isActive: true,
        categoryId: tea.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Hot Chocolate',
        nameAr: 'شوكولاتة ساخنة',
        descriptionEn: 'Rich hot chocolate with whipped cream',
        descriptionAr: 'شوكولاتة ساخنة غنية مع كريمة مخفوقة',
        price: 5.49,
        calories: 320,
        isActive: true,
        categoryId: tea.id,
        tenantId: coffeeShop.id
      }
    ]
  })

  const pastries = await prisma.category.create({
    data: {
      nameEn: 'Pastries & Snacks',
      nameAr: 'المعجنات والوجبات الخفيفة',
      descriptionEn: 'Freshly baked pastries and light snacks',
      descriptionAr: 'معجنات طازجة ووجبات خفيفة',
      displayOrder: 5,
      isActive: true,
      tenantId: coffeeShop.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Croissant',
        nameAr: 'كرواسون',
        descriptionEn: 'Buttery flaky French pastry',
        descriptionAr: 'معجنات فرنسية بالزبدة ومقرمشة',
        price: 4.99,
        calories: 250,
        isActive: true,
        isFeatured: true,
        categoryId: pastries.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Chocolate Muffin',
        nameAr: 'مافن بالشوكولاتة',
        descriptionEn: 'Moist chocolate muffin with chocolate chips',
        descriptionAr: 'مافن شوكولاتة رطب مع رقائق الشوكولاتة',
        price: 4.49,
        calories: 420,
        isActive: true,
        categoryId: pastries.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Blueberry Muffin',
        nameAr: 'مافن بالتوت الأزرق',
        descriptionEn: 'Fresh blueberry muffin',
        descriptionAr: 'مافن بالتوت الأزرق الطازج',
        price: 4.49,
        calories: 380,
        isActive: true,
        categoryId: pastries.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Cinnamon Roll',
        nameAr: 'رول القرفة',
        descriptionEn: 'Sweet cinnamon roll with cream cheese frosting',
        descriptionAr: 'رول القرفة الحلو مع كريمة الجبن',
        price: 5.49,
        calories: 480,
        isActive: true,
        isFeatured: true,
        categoryId: pastries.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Bagel with Cream Cheese',
        nameAr: 'بيجل مع كريمة الجبن',
        descriptionEn: 'Toasted bagel with cream cheese',
        descriptionAr: 'بيجل محمص مع كريمة الجبن',
        price: 4.99,
        calories: 320,
        isActive: true,
        categoryId: pastries.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Cookies',
        nameAr: 'كوكيز',
        descriptionEn: 'Assorted fresh-baked cookies',
        descriptionAr: 'كوكيز طازج بنكهات متنوعة',
        price: 2.99,
        calories: 180,
        isActive: true,
        categoryId: pastries.id,
        tenantId: coffeeShop.id
      }
    ]
  })

  const smoothies = await prisma.category.create({
    data: {
      nameEn: 'Smoothies & Juices',
      nameAr: 'السموثي والعصائر',
      descriptionEn: 'Fresh fruit smoothies and juices',
      descriptionAr: 'سموثي وعصائر فواكه طازجة',
      displayOrder: 6,
      isActive: true,
      tenantId: coffeeShop.id
    }
  })

  await prisma.product.createMany({
    data: [
      {
        nameEn: 'Strawberry Banana Smoothie',
        nameAr: 'سموثي الفراولة والموز',
        descriptionEn: 'Blend of strawberries, banana, and yogurt',
        descriptionAr: 'مزيج من الفراولة والموز والزبادي',
        price: 6.99,
        calories: 280,
        isActive: true,
        isFeatured: true,
        categoryId: smoothies.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Mango Passion Smoothie',
        nameAr: 'سموثي المانجو والباشن فروت',
        descriptionEn: 'Tropical mango and passion fruit blend',
        descriptionAr: 'مزيج استوائي من المانجو وفاكهة الباشن',
        price: 7.49,
        calories: 240,
        isActive: true,
        categoryId: smoothies.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Green Detox Smoothie',
        nameAr: 'سموثي أخضر ديتوكس',
        descriptionEn: 'Spinach, kale, apple, and banana blend',
        descriptionAr: 'مزيج السبانخ والكرنب والتفاح والموز',
        price: 7.99,
        calories: 180,
        isActive: true,
        categoryId: smoothies.id,
        tenantId: coffeeShop.id
      },
      {
        nameEn: 'Fresh Orange Juice',
        nameAr: 'عصير برتقال طازج',
        descriptionEn: 'Freshly squeezed orange juice',
        descriptionAr: 'عصير برتقال طازج',
        price: 5.99,
        calories: 110,
        isActive: true,
        categoryId: smoothies.id,
        tenantId: coffeeShop.id
      }
    ]
  })

  console.log('✅ Coffee shop menu created successfully')

  console.log('\n🎉 All done!')
  console.log('\n📋 Summary:')
  console.log('1. ❌ Deleted: Waseem tenant (waseemco)')
  console.log('2. ✅ Created: La Bella Italia (Italian Restaurant)')
  console.log('   - Admin: admin@labellaitalia.com')
  console.log('   - Password: 123456')
  console.log('   - URL: themenugenie.com/menu/labellaitalia')
  console.log('   - 6 categories with 27 products')
  console.log('3. ✅ Created: Café Aroma (Coffee Shop)')
  console.log('   - Admin: admin@cafearoma.com')
  console.log('   - Password: 123456')
  console.log('   - URL: themenugenie.com/menu/cafearoma')
  console.log('   - 6 categories with 30 products')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
