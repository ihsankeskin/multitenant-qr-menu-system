import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, verifyPassword, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
})

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing or invalid authorization header',
          error: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decodedToken = await verifyToken(token)
    
    if (!decodedToken || (decodedToken.role !== 'SUPER_ADMIN' && decodedToken.role !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied',
          error: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = changePasswordSchema.parse(body)

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.sub as string },
      select: {
        id: true,
        email: true,
        password: true,
        mustChangePassword: true
      }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(validatedData.currentPassword, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect',
          error: 'INVALID_PASSWORD'
        },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword)

    // Update password and clear mustChangePassword flag
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGE',
        resource: 'USER',
        resourceId: user.id,
        userId: user.id,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'POST',
        requestUrl: '/api/v1/super-admin/auth/change-password'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Password change error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          error: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
