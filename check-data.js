const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function checkData() {
  console.log('🔍 Starting database check...\n');
  
  try {
    // Test connection first
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Find waseemco tenant
    console.log('Looking for tenant "waseemco"...');
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'waseemco' }
    });

    if (!tenant) {
      console.log('❌ Tenant "waseemco" not found');
      
      // List all tenants
      const allTenants = await prisma.tenant.findMany({
        select: { subdomain: true, businessNameEn: true }
      });
      console.log('\n📋 Available tenants:', allTenants);
      return;
    }

    console.log('✅ Tenant found:', {
      id: tenant.id,
      businessNameEn: tenant.businessNameEn,
      subdomain: tenant.subdomain
    });

    // Get categories
    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        isActive: true,
        _count: {
          select: { products: true }
        }
      }
    });

    console.log(`\n📁 Categories (${categories.length}):`);
    categories.forEach(cat => {
      console.log(`  - ${cat.nameEn} (${cat.id.substring(0, 8)}...)`, {
        active: cat.isActive,
        products: cat._count.products
      });
    });

    // Get products
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        nameEn: true,
        categoryId: true,
        isActive: true,
        basePrice: true
      }
    });

    console.log(`\n📦 Products (${products.length}):`);
    products.forEach(prod => {
      const category = categories.find(c => c.id === prod.categoryId);
      console.log(`  - ${prod.nameEn}`, {
        categoryId: prod.categoryId.substring(0, 8) + '...',
        categoryExists: !!category,
        categoryName: category?.nameEn || 'NOT FOUND',
        active: prod.isActive,
        price: prod.basePrice.toString()
      });
    });

    // Count stats
    const stats = {
      totalCategories: await prisma.category.count({ where: { tenantId: tenant.id } }),
      activeCategories: await prisma.category.count({ where: { tenantId: tenant.id, isActive: true } }),
      totalProducts: await prisma.product.count({ where: { tenantId: tenant.id } }),
      activeProducts: await prisma.product.count({ where: { tenantId: tenant.id, isActive: true } })
    };

    console.log('\n📊 Statistics:', stats);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🔌 Disconnecting from database...');
    await prisma.$disconnect();
  }
}

checkData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
