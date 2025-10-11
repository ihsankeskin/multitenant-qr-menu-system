import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Test endpoint called')
    const count = await prisma.tenant.count()
    console.log('Tenant count:', count)
    
    const tenants = await prisma.tenant.findMany({
      take: 5,
      select: {
        id: true,
        businessName: true,
        slug: true
      }
    })
    console.log('Tenants found:', tenants.length)
    
    return NextResponse.json({
      success: true,
      count,
      tenants
    })
  } catch (error: any) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
