#!/usr/bin/env node
/**
 * Diagnostic Script for API Errors
 * This script helps diagnose the 500 error on /api/v1/super-admin/tenants
 */

const { PrismaClient } = require('@prisma/client')

async function main() {
  console.log('🔍 Starting API Diagnostics...\n')

  // Check environment variables
  console.log('1️⃣ Checking Environment Variables:')
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('   POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL ? '✅ Set' : '❌ Missing')
  console.log('   POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? '✅ Set' : '❌ Missing')
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing')
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development')
  console.log('')

  // Test database connection
  console.log('2️⃣ Testing Database Connection:')
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    console.log('   ✅ Database connection successful')
    
    // Test query
    console.log('\n3️⃣ Testing Database Queries:')
    
    // Check if tables exist
    try {
      const tenantCount = await prisma.tenant.count()
      console.log(`   ✅ Tenants table accessible (${tenantCount} records)`)
    } catch (error) {
      console.log('   ❌ Error accessing tenants table:', error.message)
    }

    try {
      const businessTypeCount = await prisma.businessType.count()
      console.log(`   ✅ BusinessTypes table accessible (${businessTypeCount} records)`)
    } catch (error) {
      console.log('   ❌ Error accessing businessTypes table:', error.message)
    }

    try {
      const paymentRecordCount = await prisma.paymentRecord.count()
      console.log(`   ✅ PaymentRecords table accessible (${paymentRecordCount} records)`)
    } catch (error) {
      console.log('   ❌ Error accessing paymentRecords table:', error.message)
    }

    // Test the exact query from the API
    console.log('\n4️⃣ Testing Exact API Query:')
    try {
      const tenants = await prisma.tenant.findMany({
        take: 1,
        include: {
          businessType: true,
          _count: {
            select: {
              tenantUsers: true,
              categories: true,
              products: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      
      console.log(`   ✅ Query successful, found ${tenants.length} tenant(s)`)
      
      if (tenants.length > 0) {
        const tenant = tenants[0]
        console.log('\n   Sample tenant data:')
        console.log('   - ID:', tenant.id)
        console.log('   - Business Name:', tenant.businessName)
        console.log('   - BusinessType:', tenant.businessType ? tenant.businessType.nameEn : 'NULL')
        console.log('   - BusinessTypeId:', tenant.businessTypeId)
        console.log('   - Subscription Status:', tenant.subscriptionStatus)
        
        // Test revenue query
        console.log('\n5️⃣ Testing Revenue Query:')
        const revenueResult = await prisma.paymentRecord.aggregate({
          where: {
            tenantId: tenant.id,
            status: 'PAID'
          },
          _sum: { amount: true }
        })
        console.log(`   ✅ Revenue query successful: ${revenueResult._sum?.amount || 0}`)
      } else {
        console.log('\n   ⚠️  No tenants found in database')
      }
      
    } catch (error) {
      console.log('   ❌ Query failed:', error.message)
      console.log('   Error details:', error)
    }

  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message)
    console.log('   Error details:', error)
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n✅ Diagnostics complete!')
}

main().catch(console.error)
