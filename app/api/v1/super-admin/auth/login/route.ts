import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateTokens } from '@/lib/auth'
import { UserRoleType } from '@/lib/validation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user with super admin role
    const user = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        role: 'SUPER_ADMIN',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        mfaEnabled: true,
        mfaSecret: true,
        lastLogin: true,
        loginAttempts: true,
        lockedUntil: true
      }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is locked due to multiple failed login attempts',
          error: 'ACCOUNT_LOCKED'
        },
        { status: 423 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(validatedData.password, user.password)
    
    if (!isPasswordValid) {
      // Increment login attempts
      const attempts = (user.loginAttempts || 0) + 1
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null // Lock for 15 minutes after 5 attempts

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: lockUntil
        }
      })

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
          error: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      )
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!validatedData.mfaCode) {
        return NextResponse.json(
          {
            success: true,
            requiresMfa: true,
            message: 'MFA code required'
          },
          { status: 200 }
        )
      }

      // Verify MFA code (simplified - in production use authenticator library)
      const isValidMfaCode = verifyMfaCode(validatedData.mfaCode, user.mfaSecret)
      
      if (!isValidMfaCode) {
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid MFA code',
            error: 'INVALID_MFA'
          },
          { status: 401 }
        )
      }
    }

    // Generate tokens
    const tokens = await generateTokens({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRoleType,
      tenantUsers: []
    })

    // Update user login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginAttempts: 0,
        lockedUntil: null
      }
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id,
        userId: user.id,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'POST',
        requestUrl: '/api/v1/super-admin/auth/login'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    })

  } catch (error) {
    console.error('Super admin login error:', error)
    
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

// Simplified MFA verification (in production, use proper TOTP library)
function verifyMfaCode(code: string, secret: string | null): boolean {
  if (!secret || !code) return false
  
  // This is a simplified implementation
  // In production, use libraries like 'speakeasy' or 'otplib'
  const timeWindow = Math.floor(Date.now() / 30000)
  const expectedCode = generateTotpCode(secret, timeWindow)
  
  return code === expectedCode
}

// Simplified TOTP generation (replace with proper library)
function generateTotpCode(secret: string, timeWindow: number): string {
  // MFA implementation
  // In production, use proper TOTP generation
  const hash = Buffer.from(`${secret}-${timeWindow}`).toString('hex')
  return hash.slice(0, 6).padStart(6, '0')
}