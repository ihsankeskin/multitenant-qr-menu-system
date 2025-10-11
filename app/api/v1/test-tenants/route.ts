import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('===== TEST TENANTS API =====')
    
    // Check authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decodedToken = await verifyToken(token)
    
    if (!decodedToken || decodedToken.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Step 1: Auth OK')

    // Try just counting first
    const count = await prisma.tenant.count()
    console.log('Step 2: Count =', count)

    // Try fetching without includes
    const tenantsBasic = await prisma.tenant.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    console.log('Step 3: Basic fetch =', tenantsBasic.length)

    // Try with businessType include
    const tenantsWithBT = await prisma.tenant.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        businessType: true
      }
    })
    console.log('Step 4: With businessType =', tenantsWithBT.length)

    // Try with _count
    const tenantsWithCount = await prisma.tenant.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        businessType: true,
        _count: {
          select: {
            products: true,
            categories: true,
            tenantUsers: true
          }
        }
      }
    })
    console.log('Step 5: With _count =', tenantsWithCount.length)

    return NextResponse.json({
      success: true,
      message: 'All queries successful',
      data: {
        count,
        basicFetch: tenantsBasic.length,
        withBusinessType: tenantsWithBT.length,
        withCount: tenantsWithCount.length,
        sample: tenantsWithCount.map(t => ({
          id: t.id,
          businessName: t.businessName,
          businessType: t.businessType?.nameEn,
          counts: {
            products: t._count.products,
            categories: t._count.categories,
            users: t._count.tenantUsers
          }
        }))
      }
    })

  } catch (error: any) {
    console.error('===== TEST TENANTS ERROR =====')
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
