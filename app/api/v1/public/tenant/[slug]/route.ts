import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tenant slug is required' 
        },
        { status: 400 }
      )
    }

    // Find tenant by slug (could be subdomain or custom slug)
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: slug },
          { subdomain: slug }
        ],
        isActive: true
      },
      select: {
        id: true,
        slug: true,
        businessName: true,
        businessNameAr: true,
        subdomain: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        description: true,
        descriptionAr: true,
        defaultLanguage: true,
        currency: true,
        timezone: true,
        businessType: {
          select: {
            nameEn: true,
            nameAr: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tenant not found' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant
      }
    })

  } catch (error) {
    console.error('Error fetching tenant info:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}