import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, message, tenantSlug } = body

    // Validation
    if (!email || !tenantSlug) {
      return NextResponse.json(
        { success: false, message: 'Email and tenant information are required', error: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        businessName: true,
        slug: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found', error: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if user exists for this tenant
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        tenantUsers: {
          some: {
            tenantId: tenant.id
          }
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    })

    if (!user) {
      // Even if user doesn't exist, we still create the notification for security
      // This prevents email enumeration attacks
      console.log(`Password reset request for non-existent user: ${email} on tenant: ${tenantSlug}`)
    }

    // Create notification for super admins
    const notificationTitle = `Password Reset Request - ${tenant.businessName}`
    const notificationMessage = user 
      ? `User ${user.firstName} ${user.lastName} (${user.email}) has requested a password reset for tenant "${tenant.businessName}" (${tenant.slug}).${message ? `\n\nUser Message: ${message}` : ''}`
      : `Password reset request received for email ${email} on tenant "${tenant.businessName}" (${tenant.slug}), but no matching user account was found.${message ? `\n\nProvided Message: ${message}` : ''}`

    // Get all super admin users
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        isActive: true
      },
      select: {
        id: true
      }
    })

    // Create notifications for all super admins
    await Promise.all(
      superAdmins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PASSWORD_RESET_REQUEST',
            title: notificationTitle,
            message: notificationMessage,
            priority: 'HIGH',
            relatedEntity: 'Tenant',
            relatedEntityId: tenant.id,
            metadata: JSON.stringify({
              tenantId: tenant.id,
              tenantSlug: tenant.slug,
              tenantName: tenant.businessName,
              requestEmail: email,
              userId: user?.id,
              userMessage: message,
              requestedAt: new Date().toISOString()
            })
          }
        })
      )
    )

    // Log the request in audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.id || 'system',
          tenantId: tenant.id,
          action: 'PASSWORD_RESET_REQUEST',
          resource: 'User',
          resourceId: user?.id || email,
          newValues: JSON.stringify({ 
            email, 
            tenantSlug,
            message: message || 'No additional message',
            hasMatchingUser: !!user
          }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          requestMethod: 'POST',
          requestUrl: '/api/v1/tenant/auth/forgot-password'
        }
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Continue anyway - audit log failure shouldn't break the operation
    }

    return NextResponse.json({
      success: true,
      message: 'Your password reset request has been submitted. The Menu Genie support team will contact you shortly.',
      data: {
        email,
        tenantName: tenant.businessName
      }
    })

  } catch (error: any) {
    console.error('====== FORGOT PASSWORD ERROR ======')
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('===================================')
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process password reset request. Please try again or contact support directly.',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
