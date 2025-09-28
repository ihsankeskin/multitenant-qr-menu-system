import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Allow both super admins and tenant users to view business types
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.TENANT_MANAGER]
    if (!allowedRoles.includes(payload.role as any)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const businessTypes = await prisma.businessType.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        descriptionEn: true,
        descriptionAr: true,
        sortOrder: true
      }
    })

    return NextResponse.json({
      success: true,
      businessTypes
    })

  } catch (error) {
    console.error('Error fetching business types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}