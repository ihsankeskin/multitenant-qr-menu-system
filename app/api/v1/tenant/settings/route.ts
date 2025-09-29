import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decodedToken: any

    try {
      decodedToken = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid token',
          error: 'INVALID_TOKEN'
        },
        { status: 401 }
      )
    }

    // Get the tenant ID from the token
    const tenantId = decodedToken.tenantId

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid token: tenant ID missing',
          error: 'INVALID_TOKEN'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      nameEn,
      nameAr,
      primaryColor,
      secondaryColor,
      accentColor,
      logoUrl,
      coverImageUrl,
      phone,
      email,
      address,
      showPrices,
      showCalories,
      showDescriptions,
      showImages,
      defaultLanguage,
      enableBilingualMenu,
      currency,
      currencyPosition,
      businessHours
    } = body

    // Update tenant settings
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        businessName: nameEn,
        businessNameAr: nameAr,
        primaryColor,
        secondaryColor,
        accentColor,
        logoUrl,
        phone,
        email: email || undefined,
        address,
        defaultLanguage,
        currency,
        // Store additional settings as JSON in a custom field if needed
        // For now, we'll use the existing fields
      },
      select: {
        id: true,
        slug: true,
        businessName: true,
        businessNameAr: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        phone: true,
        email: true,
        address: true,
        defaultLanguage: true,
        currency: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedTenant
    })

  } catch (error) {
    console.error('Tenant settings update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decodedToken: any

    try {
      decodedToken = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid token',
          error: 'INVALID_TOKEN'
        },
        { status: 401 }
      )
    }

    // Get the tenant ID from the token
    const tenantId = decodedToken.tenantId

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid token: tenant ID missing',
          error: 'INVALID_TOKEN'
        },
        { status: 401 }
      )
    }

    // Get tenant settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        businessName: true,
        businessNameAr: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        phone: true,
        email: true,
        address: true,
        defaultLanguage: true,
        currency: true,
        timezone: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tenant not found',
          error: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: tenant
    })

  } catch (error) {
    console.error('Tenant settings retrieval error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}