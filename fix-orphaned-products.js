// Fix orphaned products - Update products to use existing category
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrphanedProducts() {
  console.log('🔧 Starting to fix orphaned products...\n');

  try {
    // Find waseemco tenant
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'waseemco' }
    });

    if (!tenant) {
      console.log('❌ Tenant "waseemco" not found');
      return;
    }

    console.log('✅ Tenant found:', {
      id: tenant.id.substring(0, 12) + '...',
      name: tenant.businessNameEn,
      subdomain: tenant.subdomain
    });

    // Get all categories for this tenant
    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        isActive: true
      }
    });

    console.log(`\n📁 Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.nameEn} (${cat.nameAr}) - ${cat.isActive ? 'Active' : 'Inactive'}`);
      console.log(`    ID: ${cat.id}`);
    });

    if (categories.length === 0) {
      console.log('\n⚠️  No categories found. Creating a default category...');
      
      const defaultCategory = await prisma.category.create({
        data: {
          tenantId: tenant.id,
          nameEn: 'Beverages',
          nameAr: 'مشروبات',
          descriptionEn: 'Hot and cold beverages',
          descriptionAr: 'مشروبات ساخنة وباردة',
          isActive: true,
          sortOrder: 0,
          createdById: tenant.id // Using tenant ID as creator for now
        }
      });

      console.log(`✅ Created default category: ${defaultCategory.nameEn} (ID: ${defaultCategory.id})`);
      categories.push(defaultCategory);
    }

    // Use the first active category (or first category if none active)
    const targetCategory = categories.find(c => c.isActive) || categories[0];

    console.log(`\n🎯 Target category: ${targetCategory.nameEn} (${targetCategory.id.substring(0, 12)}...)`);

    // Get all products for this tenant
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        nameEn: true,
        categoryId: true,
        basePrice: true,
        isActive: true
      }
    });

    console.log(`\n📦 Found ${products.length} products:\n`);

    let fixedCount = 0;
    for (const product of products) {
      // Check if the product's categoryId exists in our categories
      const categoryExists = categories.some(c => c.id === product.categoryId);
      
      if (!categoryExists) {
        console.log(`❌ Product "${product.nameEn}" has invalid categoryId: ${product.categoryId.substring(0, 12)}...`);
        console.log(`   Updating to: ${targetCategory.nameEn} (${targetCategory.id.substring(0, 12)}...)`);

        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: targetCategory.id }
        });

        fixedCount++;
        console.log(`   ✅ Fixed!\n`);
      } else {
        const category = categories.find(c => c.id === product.categoryId);
        console.log(`✅ Product "${product.nameEn}" already has valid category: ${category?.nameEn}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Already valid: ${products.length - fixedCount}`);

    // Verify the fix
    console.log(`\n🔍 Verification:`);
    const stats = {
      totalCategories: await prisma.category.count({ where: { tenantId: tenant.id } }),
      activeCategories: await prisma.category.count({ where: { tenantId: tenant.id, isActive: true } }),
      totalProducts: await prisma.product.count({ where: { tenantId: tenant.id } }),
      activeProducts: await prisma.product.count({ where: { tenantId: tenant.id, isActive: true } })
    };

    console.log(`   Categories: ${stats.totalCategories} total, ${stats.activeCategories} active`);
    console.log(`   Products: ${stats.totalProducts} total, ${stats.activeProducts} active`);

    console.log('\n✨ Fix completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixOrphanedProducts()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
