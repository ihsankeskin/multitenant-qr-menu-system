// Login credentials
const BELLA_ITALIA_LOGIN = {
  email: 'admin@bellaitalia.com',
  password: 'Admin123!',
  tenant: 'bella-italia'
};

const ARTISAN_BREW_LOGIN = {
  email: 'admin@artisanbrew.com',
  password: 'Admin123!',
  tenant: 'artisan-brew'
};

// Products to add to Bella Italia (Italian restaurant)
const BELLA_ITALIA_PRODUCTS = [
  {
    name: 'Caprese Salad',
    nameAr: 'سلطة كابريزي',
    description: 'Fresh mozzarella, tomatoes, basil, and balsamic glaze',
    descriptionAr: 'جبنة موزاريلا طازجة وطماطم وريحان وصلصة بلسميك',
    category: 'Pasta', // Will use existing category
    price: 10.99,
    calories: 220
  },
  {
    name: 'Risotto ai Funghi',
    nameAr: 'ريزوتو بالفطر',
    description: 'Creamy arborio rice with wild mushrooms and parmesan',
    descriptionAr: 'أرز أربوريو كريمي مع فطر بري وجبن بارميزان',
    category: 'Pasta',
    price: 15.99,
    calories: 420
  },
  {
    name: 'Osso Buco',
    nameAr: 'أوسو بوكو',
    description: 'Slow-braised veal shanks with gremolata and risotto',
    descriptionAr: 'ساق عجل مطهوة ببطء مع غريمولاتا وريزوتو',
    category: 'Pasta',
    price: 24.99,
    calories: 680
  },
  {
    name: 'Chicken Parmigiana',
    nameAr: 'دجاج بارميجيانا',
    description: 'Breaded chicken breast with marinara sauce and melted mozzarella',
    descriptionAr: 'صدر دجاج مقرمش مع صلصة مارينارا وجبن موزاريلا ذائبة',
    category: 'Pasta',
    price: 18.99,
    calories: 560
  },
  {
    name: 'Pepperoni Pizza',
    nameAr: 'بيتزا ببروني',
    description: 'Classic pizza with spicy pepperoni and mozzarella cheese',
    descriptionAr: 'بيتزا كلاسيكية مع ببروني حار وجبن موزاريلا',
    category: 'Pizza',
    price: 14.99,
    calories: 520
  },
  {
    name: 'Prosciutto e Rucola',
    nameAr: 'بروشوتو وروكولا',
    description: 'Pizza with prosciutto, arugula, parmesan, and cherry tomatoes',
    descriptionAr: 'بيتزا مع بروشوتو وجرجير وبارميزان وطماطم كرزية',
    category: 'Pizza',
    price: 17.99,
    calories: 480
  },
  {
    name: 'Calzone',
    nameAr: 'كالزوني',
    description: 'Folded pizza filled with ricotta, mozzarella, and Italian sausage',
    descriptionAr: 'بيتزا مطوية محشوة بالريكوتا والموزاريلا والسجق الإيطالي',
    category: 'Pizza',
    price: 16.99,
    calories: 620
  },
  {
    name: 'Panna Cotta',
    nameAr: 'بانا كوتا',
    description: 'Creamy Italian dessert with vanilla and berry compote',
    descriptionAr: 'حلوى إيطالية كريمية بالفانيليا وكومبوت التوت',
    category: 'Desserts',
    price: 6.99,
    calories: 280
  },
  {
    name: 'Cannoli',
    nameAr: 'كانولي',
    description: 'Crispy pastry shells filled with sweet ricotta and chocolate chips',
    descriptionAr: 'قشور معجنات مقرمشة محشوة بريكوتا حلوة ورقائق شوكولاتة',
    category: 'Desserts',
    price: 7.99,
    calories: 320
  },
  {
    name: 'Gelato',
    nameAr: 'جيلاتو',
    description: 'Italian ice cream - choice of flavors: pistachio, hazelnut, or stracciatella',
    descriptionAr: 'آيس كريم إيطالي - اختيار النكهات: فستق، بندق، أو استراشياتيلا',
    category: 'Desserts',
    price: 5.99,
    calories: 240
  }
];

// Products to add to Artisan Brew (Coffee shop)
const ARTISAN_BREW_PRODUCTS = [
  {
    name: 'Mocha',
    nameAr: 'موكا',
    description: 'Espresso with steamed milk and rich chocolate',
    descriptionAr: 'إسبريسو مع حليب مبخر وشوكولاتة غنية',
    category: 'Hot Coffee',
    price: 6.99,
    calories: 290
  },
  {
    name: 'Flat White',
    nameAr: 'فلات وايت',
    description: 'Double shot espresso with velvety microfoam milk',
    descriptionAr: 'جرعة إسبريسو مزدوجة مع حليب رغوي ناعم',
    category: 'Hot Coffee',
    price: 5.99,
    calories: 180
  },
  {
    name: 'Turkish Coffee',
    nameAr: 'قهوة تركية',
    description: 'Traditional Turkish coffee served with cardamom',
    descriptionAr: 'قهوة تركية تقليدية تقدم مع الهيل',
    category: 'Hot Coffee',
    price: 4.99,
    calories: 20
  },
  {
    name: 'Matcha Latte',
    nameAr: 'ماتشا لاتيه',
    description: 'Japanese green tea powder with steamed milk',
    descriptionAr: 'مسحوق الشاي الأخضر الياباني مع حليب مبخر',
    category: 'Hot Coffee',
    price: 7.49,
    calories: 210
  },
  {
    name: 'Smoothie Bowl',
    nameAr: 'سموذي بول',
    description: 'Blended acai berries topped with granola, fruits, and honey',
    descriptionAr: 'توت أساي مخلوط مع جرانولا وفواكه وعسل',
    category: 'Cold Drinks',
    price: 9.99,
    calories: 380
  },
  {
    name: 'Fresh Orange Juice',
    nameAr: 'عصير برتقال طازج',
    description: 'Freshly squeezed orange juice',
    descriptionAr: 'عصير برتقال طازج معصور',
    category: 'Cold Drinks',
    price: 5.99,
    calories: 120
  },
  {
    name: 'Chocolate Chip Cookie',
    nameAr: 'كوكيز برقائق الشوكولاتة',
    description: 'Homemade cookie with Belgian chocolate chips',
    descriptionAr: 'كوكي منزلي مع رقائق شوكولاتة بلجيكية',
    category: 'Pastries',
    price: 3.99,
    calories: 280
  },
  {
    name: 'Blueberry Muffin',
    nameAr: 'مافن التوت الأزرق',
    description: 'Fresh-baked muffin loaded with blueberries',
    descriptionAr: 'مافن مخبوز طازج محمل بالتوت الأزرق',
    category: 'Pastries',
    price: 4.49,
    calories: 320
  },
  {
    name: 'Almond Croissant',
    nameAr: 'كرواسون باللوز',
    description: 'Buttery croissant filled with almond cream',
    descriptionAr: 'كرواسون بالزبدة محشي بكريمة اللوز',
    category: 'Pastries',
    price: 5.49,
    calories: 420
  },
  {
    name: 'Pumpkin Spice Latte',
    nameAr: 'لاتيه توابل اليقطين',
    description: 'Seasonal favorite with pumpkin, cinnamon, and nutmeg',
    descriptionAr: 'المفضل الموسمي مع اليقطين والقرفة وجوزة الطيب',
    category: 'Specialty Drinks',
    price: 7.99,
    calories: 340
  },
  {
    name: 'Caramel Macchiato',
    nameAr: 'كراميل ماكياتو',
    description: 'Espresso with vanilla, steamed milk, and caramel drizzle',
    descriptionAr: 'إسبريسو مع فانيليا وحليب مبخر ورذاذ كراميل',
    category: 'Specialty Drinks',
    price: 7.49,
    calories: 320
  }
];

async function login(credentials) {
  const response = await fetch(`https://themenugenie.com/api/v1/tenant/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      tenantSlug: credentials.tenant
    })
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Login failed: ${data.message}`);
  }
  
  return data.data.token;
}

async function getCategories(token) {
  const response = await fetch(`https://themenugenie.com/api/v1/tenant/categories?limit=100`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Failed to fetch categories: ${data.message}`);
  }

  return data.data.categories;
}

async function addProduct(token, product, categoryId) {
  const response = await fetch(`https://themenugenie.com/api/v1/tenant/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nameEn: product.name,
      nameAr: product.nameAr,
      descriptionEn: product.description,
      descriptionAr: product.descriptionAr,
      categoryId: categoryId,
      basePrice: product.price,
      calories: product.calories,
      isActive: true,
      isAvailable: true
    })
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Failed to add product ${product.name}: ${data.message}`);
  }

  return data.data;
}

async function addProductsToMenu(credentials, products) {
  try {
    console.log(`\n🔐 Logging in to ${credentials.tenant}...`);
    const token = await login(credentials);
    console.log(`✅ Logged in successfully`);

    console.log(`\n📋 Fetching categories...`);
    const categories = await getCategories(token);
    console.log(`✅ Found ${categories.length} categories`);

    // Create a map of category names to IDs
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.nameEn] = cat.id;
    });

    console.log(`\n🍽️  Adding ${products.length} products...`);
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const categoryId = categoryMap[product.category];
        if (!categoryId) {
          console.log(`⚠️  Category "${product.category}" not found for ${product.name}, skipping...`);
          errorCount++;
          continue;
        }

        await addProduct(token, product, categoryId);
        console.log(`✅ Added: ${product.name} (${product.nameAr})`);
        successCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`❌ Error adding ${product.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Results for ${credentials.tenant}:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${products.length}`);

  } catch (error) {
    console.error(`❌ Fatal error for ${credentials.tenant}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting product addition process...\n');
  console.log('=' .repeat(60));

  // Add products to Bella Italia
  console.log('\n🇮🇹 BELLA ITALIA');
  console.log('=' .repeat(60));
  await addProductsToMenu(BELLA_ITALIA_LOGIN, BELLA_ITALIA_PRODUCTS);

  // Add products to Artisan Brew
  console.log('\n\n☕ ARTISAN BREW COFFEE');
  console.log('=' .repeat(60));
  await addProductsToMenu(ARTISAN_BREW_LOGIN, ARTISAN_BREW_PRODUCTS);

  console.log('\n\n🎉 Process completed!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
