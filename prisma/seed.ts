import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Starting seed process...')

    // Create Super Admin user first (needed for foreign key references)
    console.log('👤 Creating Super Admin user...')
    const hashedPassword = await hashPassword('SuperAdmin123!')
    
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@qrmenu.system' },
      update: {},
      create: {
        email: 'admin@qrmenu.system',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        mustChangePassword: false,
        mfaEnabled: false,
        loginAttempts: 0
      }
    })
    console.log(`✅ Created Super Admin user: ${superAdmin.email}`)

    // Create business types
    const businessTypes = [
      {
        nameEn: 'Restaurant',
        nameAr: 'مطعم',
        descriptionEn: 'Full-service restaurants and dining establishments',
        descriptionAr: 'مطاعم الخدمة الكاملة ومؤسسات الطعام',
        sortOrder: 1
      },
      {
        nameEn: 'Cafe',
        nameAr: 'مقهى',
        descriptionEn: 'Coffee shops, cafes, and light dining',
        descriptionAr: 'محلات القهوة والمقاهي والوجبات الخفيفة',
        sortOrder: 2
      },
      {
        nameEn: 'Fast Food',
        nameAr: 'وجبات سريعة',
        descriptionEn: 'Quick service restaurants and food chains',
        descriptionAr: 'مطاعم الخدمة السريعة وسلاسل الطعام',
        sortOrder: 3
      },
      {
        nameEn: 'Bakery',
        nameAr: 'مخبز',
        descriptionEn: 'Bakeries and pastry shops',
        descriptionAr: 'المخابز ومحلات الحلويات',
        sortOrder: 4
      },
      {
        nameEn: 'Bar & Lounge',
        nameAr: 'بار وصالة',
        descriptionEn: 'Bars, lounges, and beverage-focused establishments',
        descriptionAr: 'البارات والصالات والمؤسسات المتخصصة في المشروبات',
        sortOrder: 5
      }
    ]

    console.log('📝 Creating business types...')
    const createdBusinessTypes = []
    for (const businessType of businessTypes) {
      const existing = await prisma.businessType.findFirst({
        where: { nameEn: businessType.nameEn }
      })
      
      let created
      if (existing) {
        created = await prisma.businessType.update({
          where: { id: existing.id },
          data: {
            ...businessType,
            createdById: superAdmin.id
          }
        })
      } else {
        created = await prisma.businessType.create({
          data: {
            ...businessType,
            createdById: superAdmin.id
          }
        })
      }
      createdBusinessTypes.push(created)
    }
    console.log(`✅ Created ${createdBusinessTypes.length} business types`)

    // Create a sample tenant for testing (or update if exists)
    console.log('🏢 Creating sample tenant...')
    const sampleTenant = await prisma.tenant.upsert({
      where: { slug: 'sample-restaurant' },
      update: {
        businessName: 'Sample Restaurant',
        businessNameAr: 'مطعم عينة'
      },
      create: {
        slug: 'sample-restaurant',
        businessName: 'Sample Restaurant',
        businessNameAr: 'مطعم عينة',
        businessTypeId: createdBusinessTypes.find(bt => bt.nameEn === 'Restaurant')!.id,
        email: 'owner@sample-restaurant.com',
        ownerName: 'John Doe',
        ownerEmail: 'owner@sample-restaurant.com',
        ownerPhone: '+1234567890',
        subdomain: 'sample-restaurant',
        defaultLanguage: 'ar',
        currency: 'EGP',
        timezone: 'Africa/Cairo',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        accentColor: '#3b82f6',
        description: 'A sample restaurant for testing the QR menu system',
        descriptionAr: 'مطعم عينة لاختبار نظام قائمة QR',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM',
        monthlyFee: 200.00,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: superAdmin.id
      }
    })
    // Create a demo tenant that matches our URL (or update if exists)
    const demoTenant = await prisma.tenant.upsert({
      where: { slug: 'demo-restaurant' },
      update: {
        businessName: 'Demo Restaurant',
        businessNameAr: 'المطعم التجريبي',
        primaryColor: '#059669'
      },
      create: {
        slug: 'demo-restaurant',
        businessName: 'Demo Restaurant',
        businessNameAr: 'المطعم التجريبي',
        businessTypeId: createdBusinessTypes.find(bt => bt.nameEn === 'Restaurant')!.id,
        email: 'owner@demo-restaurant.com',
        ownerName: 'Ahmed Ali',
        ownerEmail: 'owner@demo-restaurant.com',
        ownerPhone: '+20123456789',
        subdomain: 'demo-restaurant',
        defaultLanguage: 'ar',
        currency: 'EGP',
        timezone: 'Africa/Cairo',
        primaryColor: '#059669',
        secondaryColor: '#047857',
        accentColor: '#10b981',
        description: 'A demo restaurant showcasing the QR menu system',
        descriptionAr: 'مطعم تجريبي يعرض نظام قائمة QR',
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM',
        monthlyFee: 200.00,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: superAdmin.id
      }
    })

    // Create demo tenant users (check if they exist first)
    let demoAdmin = await prisma.user.findUnique({
      where: { email: 'admin@demo-restaurant.com' }
    })

    if (!demoAdmin) {
      demoAdmin = await prisma.user.create({
        data: {
          email: 'admin@demo-restaurant.com',
          firstName: 'Ahmed',
          lastName: 'Ali',
          role: 'TENANT_ADMIN',
          password: await hashPassword('DemoAdmin123!'),
          mustChangePassword: false,
          isActive: true,
          emailVerified: true,
          createdById: superAdmin.id
        }
      })
    }

    // Check if TenantUser relationship exists
    const existingDemoTenantUser = await prisma.tenantUser.findFirst({
      where: {
        tenantId: demoTenant.id,
        userId: demoAdmin.id
      }
    })

    if (!existingDemoTenantUser) {
      await prisma.tenantUser.create({
        data: {
          tenantId: demoTenant.id,
          userId: demoAdmin.id,
          role: 'ADMIN',
          isActive: true,
          createdById: superAdmin.id
        }
      })
    }

    console.log(`✅ Created demo tenant: ${demoTenant.businessName}`)
    
    console.log(`✅ Created sample tenant: ${sampleTenant.businessName}`)

    // Create sample users for the tenant
    console.log('👥 Creating sample tenant users...')
    
    // Tenant Admin
    const tenantAdmin = await prisma.user.create({
      data: {
        email: 'admin@sample-restaurant.com',
        firstName: 'Restaurant',
        lastName: 'Admin',
        role: 'TENANT_ADMIN',
        password: await hashPassword('TenantAdmin123!'),
        mustChangePassword: false,
        isActive: true,
        emailVerified: true,
        createdById: superAdmin.id
      }
    })

    await prisma.tenantUser.create({
      data: {
        tenantId: sampleTenant.id,
        userId: tenantAdmin.id,
        role: 'ADMIN',
        isActive: true,
        createdById: superAdmin.id
      }
    })

    // Tenant Manager  
    const tenantManager = await prisma.user.create({
      data: {
        email: 'manager@sample-restaurant.com',
        firstName: 'Restaurant',
        lastName: 'Manager',
        role: 'TENANT_MANAGER',
        password: await hashPassword('TenantManager123!'),
        mustChangePassword: false,
        isActive: true,
        emailVerified: true,
        createdById: superAdmin.id
      }
    })

    await prisma.tenantUser.create({
      data: {
        tenantId: sampleTenant.id,
        userId: tenantManager.id,
        role: 'MANAGER',
        isActive: true,
        createdById: superAdmin.id
      }
    })

    // Tenant Staff
    const tenantStaff = await prisma.user.create({
      data: {
        email: 'staff@sample-restaurant.com',
        firstName: 'Restaurant',
        lastName: 'Staff',
        role: 'TENANT_STAFF',
        password: await hashPassword('TenantStaff123!'),
        mustChangePassword: false,
        isActive: true,
        emailVerified: true,
        createdById: superAdmin.id
      }
    })

    await prisma.tenantUser.create({
      data: {
        tenantId: sampleTenant.id,
        userId: tenantStaff.id,
        role: 'STAFF',
        isActive: true,
        createdById: superAdmin.id
      }
    })

    console.log(`✅ Created 3 sample tenant users`)

    // Create sample categories for the tenant
    console.log('🍽️  Creating sample categories...')
    const categories = [
      {
        nameEn: 'Appetizers',
        nameAr: 'المقبلات',
        descriptionEn: 'Start your meal with our delicious appetizers',
        descriptionAr: 'ابدأ وجبتك مع مقبلاتنا اللذيذة',
        sortOrder: 1
      },
      {
        nameEn: 'Main Courses',
        nameAr: 'الأطباق الرئيسية',
        descriptionEn: 'Our signature main dishes',
        descriptionAr: 'أطباقنا الرئيسية المميزة',
        sortOrder: 2
      },
      {
        nameEn: 'Desserts',
        nameAr: 'الحلويات',
        descriptionEn: 'Sweet endings to your perfect meal',
        descriptionAr: 'نهاية حلوة لوجبتك المثالية',
        sortOrder: 3
      },
      {
        nameEn: 'Beverages',
        nameAr: 'المشروبات',
        descriptionEn: 'Refreshing drinks and beverages',
        descriptionAr: 'مشروبات منعشة ومتنوعة',
        sortOrder: 4
      }
    ]

    const createdCategories = []
    for (const category of categories) {
      const created = await prisma.category.create({
        data: {
          ...category,
          tenantId: sampleTenant.id,
          isActive: true,
          createdById: superAdmin.id
        }
      })
      createdCategories.push(created)
    }
    console.log(`✅ Created ${createdCategories.length} sample categories`)

    // Create sample products
    console.log('🍕 Creating sample products...')
    const products = [
      {
        nameEn: 'Caesar Salad',
        nameAr: 'سلطة قيصر',
        descriptionEn: 'Fresh romaine lettuce with parmesan cheese and Caesar dressing',
        descriptionAr: 'خس روماني طازج مع جبن البارميزان وتتبيلة القيصر',
        basePrice: 85.00,
        categoryId: createdCategories.find(c => c.nameEn === 'Appetizers')!.id
      },
      {
        nameEn: 'Grilled Chicken',
        nameAr: 'دجاج مشوي',
        descriptionEn: 'Tender grilled chicken breast with herbs and spices',
        descriptionAr: 'صدر دجاج مشوي طري مع الأعشاب والتوابل',
        basePrice: 180.00,
        categoryId: createdCategories.find(c => c.nameEn === 'Main Courses')!.id
      },
      {
        nameEn: 'Chocolate Cake',
        nameAr: 'كيك الشوكولاتة',
        descriptionEn: 'Rich chocolate cake with vanilla ice cream',
        descriptionAr: 'كيك الشوكولاتة الغني مع آيس كريم الفانيليا',
        basePrice: 65.00,
        categoryId: createdCategories.find(c => c.nameEn === 'Desserts')!.id
      },
      {
        nameEn: 'Fresh Orange Juice',
        nameAr: 'عصير برتقال طازج',
        descriptionEn: 'Freshly squeezed orange juice',
        descriptionAr: 'عصير برتقال طازج معصور',
        basePrice: 25.00,
        categoryId: createdCategories.find(c => c.nameEn === 'Beverages')!.id
      }
    ]

    let productCount = 0
    for (const product of products) {
      await prisma.product.create({
        data: {
          ...product,
          tenantId: sampleTenant.id,
          isActive: true,
          createdById: superAdmin.id
        }
      })
      productCount++
    }
    console.log(`✅ Created ${productCount} sample products`)

    // Create sample payment records
    console.log('💳 Creating sample payment records...')
    const paymentRecords = [
      {
        tenantId: sampleTenant.id,
        amount: 200.00,
        method: 'CREDIT_CARD',
        status: 'PAID',
        description: 'Monthly subscription fee - October 2024',
        invoiceNumber: 'INV-2024-10-001',
        paidAt: new Date('2024-10-01'),
        dueDate: new Date('2024-10-01'),
        createdById: superAdmin.id
      },
      {
        tenantId: sampleTenant.id,
        amount: 200.00,
        method: 'BANK_TRANSFER',
        status: 'PENDING',
        description: 'Monthly subscription fee - November 2024',
        invoiceNumber: 'INV-2024-11-001',
        dueDate: new Date('2024-11-01'),
        createdById: superAdmin.id
      },
      {
        tenantId: sampleTenant.id,
        amount: 150.00,
        method: 'CREDIT_CARD',
        status: 'OVERDUE',
        description: 'Setup fee',
        invoiceNumber: 'INV-2024-09-001',
        dueDate: new Date('2024-09-15'),
        createdById: superAdmin.id
      },
      {
        tenantId: demoTenant.id,
        amount: 200.00,
        method: 'BANK_TRANSFER',
        status: 'PAID',
        description: 'Monthly subscription fee - October 2024',
        invoiceNumber: 'INV-DEMO-2024-10-001',
        paidAt: new Date('2024-10-01'),
        dueDate: new Date('2024-10-01'),
        createdById: superAdmin.id
      },
      {
        tenantId: demoTenant.id,
        amount: 200.00,
        method: 'CREDIT_CARD',
        status: 'PENDING',
        description: 'Monthly subscription fee - November 2024',
        invoiceNumber: 'INV-DEMO-2024-11-001',
        dueDate: new Date('2024-11-01'),
        createdById: superAdmin.id
      }
    ]

    let paymentCount = 0
    for (const payment of paymentRecords) {
      await prisma.paymentRecord.create({
        data: payment
      })
      paymentCount++
    }
    console.log(`✅ Created ${paymentCount} sample payment records`)

    console.log('\n🎉 Seed completed successfully!')
    console.log('📋 Summary:')
    console.log(`   • Business Types: ${createdBusinessTypes.length}`)
    console.log(`   • Super Admin User: admin@qrmenu.system (password: SuperAdmin123!)`)
    console.log(`   • Demo Tenant: ${demoTenant.businessName}`)
    console.log(`     - Admin: admin@demo-restaurant.com (password: DemoAdmin123!)`)
    console.log(`   • Sample Tenant: ${sampleTenant.businessName}`)
    console.log(`     - Admin: admin@sample-restaurant.com (password: TenantAdmin123!)`)
    console.log(`     - Manager: manager@sample-restaurant.com (password: TenantManager123!)`)
    console.log(`     - Staff: staff@sample-restaurant.com (password: TenantStaff123!)`)
    console.log(`   • Categories: ${createdCategories.length}`)
    console.log(`   • Products: ${productCount}`)
    console.log(`   • Payment Records: ${paymentCount}`)
    console.log('\n🔗 You can now access:')
    console.log('   • Super Admin Login: http://localhost:3000/super-admin/login')
    console.log('   • Demo Restaurant Login: http://localhost:3000/tenant/demo-restaurant/login')
    console.log('   • Sample Restaurant Login: http://localhost:3000/tenant/sample-restaurant/login')

  } catch (error) {
    console.error('❌ Error during seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })