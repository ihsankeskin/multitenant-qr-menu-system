/**
 * Data Cleanup Script
 * Deletes all products and categories for a specific tenant to start fresh
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupTenantData() {
  try {
    console.log('🧹 Starting data cleanup...\n')

    // Get the waseemco tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'waseemco' }
    })

    if (!tenant) {
      console.error('❌ Tenant "waseemco" not found')
      process.exit(1)
    }

    console.log(`📋 Found tenant: ${tenant.businessName} (${tenant.slug})`)
    console.log(`   Tenant ID: ${tenant.id}\n`)

    // Check current data
    const productCount = await prisma.product.count({
      where: { tenantId: tenant.id }
    })
    const categoryCount = await prisma.category.count({
      where: { tenantId: tenant.id }
    })

    console.log('📊 Current data:')
    console.log(`   Products: ${productCount}`)
    console.log(`   Categories: ${categoryCount}\n`)

    if (productCount === 0 && categoryCount === 0) {
      console.log('✅ No data to clean up. Database is already clean.')
      return
    }

    // Delete products first (due to foreign key constraints)
    console.log('🗑️  Deleting products...')
    const deletedProducts = await prisma.product.deleteMany({
      where: { tenantId: tenant.id }
    })
    console.log(`   Deleted ${deletedProducts.count} products\n`)

    // Delete categories
    console.log('🗑️  Deleting categories...')
    const deletedCategories = await prisma.category.deleteMany({
      where: { tenantId: tenant.id }
    })
    console.log(`   Deleted ${deletedCategories.count} categories\n`)

    // Verify cleanup
    const remainingProducts = await prisma.product.count({
      where: { tenantId: tenant.id }
    })
    const remainingCategories = await prisma.category.count({
      where: { tenantId: tenant.id }
    })

    if (remainingProducts === 0 && remainingCategories === 0) {
      console.log('✅ Cleanup complete! Database is now clean.')
      console.log('   Products: 0')
      console.log('   Categories: 0')
    } else {
      console.log('⚠️  Warning: Some data may still exist')
      console.log(`   Products: ${remainingProducts}`)
      console.log(`   Categories: ${remainingCategories}`)
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupTenantData()
