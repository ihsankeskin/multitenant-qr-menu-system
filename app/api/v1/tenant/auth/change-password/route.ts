import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid token'
        },
        { status: 401 }
      )
    }

    const userId = decoded.sub as string

    const body = await request.json()
    const { currentPassword, newPassword, tenantSlug } = body

    // Validate required fields
    if (!currentPassword || !newPassword || !tenantSlug) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password, new password, and tenant are required'
        },
        { status: 400 }
      )
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be at least 8 characters long'
        },
        { status: 400 }
      )
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must contain at least one lowercase letter'
        },
        { status: 400 }
      )
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must contain at least one uppercase letter'
        },
        { status: 400 }
      )
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must contain at least one number'
        },
        { status: 400 }
      )
    }

    if (!/(?=.*[!@#$%^&*])/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must contain at least one special character (!@#$%^&*)'
        },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      )
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect'
        },
        { status: 401 }
      )
    }

    // Check if new password is same as current
    const isSamePassword = await verifyPassword(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be different from current password'
        },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password and reset mustChangePassword flag
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
        lastPasswordChange: new Date()
      }
    })

    // Find tenant for audit log
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: tenantSlug },
          { subdomain: tenantSlug }
        ]
      }
    })

    // Log the password change event
    if (tenant) {
      await prisma.auditLog.create({
        data: {
          action: 'PASSWORD_CHANGE',
          resource: 'USER',
          resourceId: user.id,
          userId: user.id,
          tenantId: tenant.id,
          ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          requestMethod: 'POST',
          requestUrl: '/api/v1/tenant/auth/change-password',
          newValues: JSON.stringify({
            passwordChanged: true,
            timestamp: new Date().toISOString()
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
