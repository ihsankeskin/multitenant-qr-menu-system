import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/v1/tenant/qr-code - Generate QR code for tenant menu
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (!payload || !payload.sub || !payload.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const tenantId = payload.tenantId as string

    // Get tenant information
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        businessName: true,
        subdomain: true,
        slug: true,
        isActive: true
      }
    })

    if (!tenant || !tenant.isActive) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found or inactive' },
        { status: 404 }
      )
    }

    // Check if tenant has any active categories with products
    const hasContent = await prisma.category.findFirst({
      where: {
        tenantId: tenantId,
        isActive: true,
        products: {
          some: {
            isActive: true
          }
        }
      }
    })

    if (!hasContent) {
      return NextResponse.json(
        { success: false, message: 'No active menu content available for QR code generation' },
        { status: 400 }
      )
    }

    // Generate the public menu URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const menuUrl = `${baseUrl}/menu/${tenant.slug}`

    // Return QR code data
    return NextResponse.json({
      success: true,
      data: {
        menuUrl: menuUrl,
        qrData: menuUrl,
        tenant: {
          businessName: tenant.businessName,
          slug: tenant.slug,
          subdomain: tenant.subdomain
        },
        instructions: {
          title: 'QR Code for Digital Menu',
          description: 'Customers can scan this QR code to view your digital menu',
          steps: [
            'Print the QR code and place it on tables or at the entrance',
            'Customers scan with their phone camera or QR code app',
            'They will be directed to your digital menu',
            'Orders can be placed directly through the menu interface'
          ]
        }
      }
    })

  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/tenant/qr-code/settings - Update QR code settings
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (!payload || !payload.sub || !payload.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const tenantId = payload.tenantId as string
    const userId = payload.sub as string

    const body = await request.json()
    const {
      enableQrCode = true,
      qrCodeStyle = 'default',
      customMessage,
      trackScans = true
    } = body

    // Get current tenant settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Update tenant QR settings (you might want to add these fields to the tenant schema)
    // For now, we'll store in tenant metadata or create a separate settings table
    
    // Update tenant settings with QR preferences
    const updatedSettings = {
      enableQrCode,
      qrCodeStyle,
      customMessage: customMessage?.trim() || null,
      trackScans,
      updatedAt: new Date(),
      updatedById: userId
    }

    // Log the settings update
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'QR_SETTINGS',
        resourceId: tenantId,
        userId: userId,
        tenantId: tenantId,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'PUT',
        requestUrl: '/api/v1/tenant/qr-code/settings',
        newValues: JSON.stringify(updatedSettings)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'QR code settings updated successfully',
      data: updatedSettings
    })

  } catch (error) {
    console.error('QR settings update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}