import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, generateTokens } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, TenantRole, objectToJson, UserRoleType } from '@/lib/validation'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, tenantSlug } = body

    // Validate required fields
    if (!email || !password || !tenantSlug) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email, password, and tenant are required'
        },
        { status: 400 }
      )
    }

    // Find the tenant first
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: tenantSlug },
          { subdomain: tenantSlug }
        ],
        isActive: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          message: 'Restaurant not found or inactive'
        },
        { status: 404 }
      )
    }

    // Find user by email with tenant relationship
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
        tenantUsers: {
          some: {
            tenantId: tenant.id,
            isActive: true
          }
        }
      },
      include: {
        tenantUsers: {
          where: {
            tenantId: tenant.id,
            isActive: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      // Increment failed login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: {
            increment: 1
          }
        }
      })

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      )
    }

    // Check if account is locked due to too many failed attempts
    if (user.loginAttempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account temporarily locked due to too many failed attempts. Please contact your administrator.'
        },
        { status: 423 }
      )
    }

    // Determine user's role within this tenant
    let tenantRole: string = TenantRole.STAFF
    const userWithTenants = user as any // Type assertion for included relations
    if (user.role === UserRole.TENANT_ADMIN || userWithTenants.tenantUsers?.some((tu: any) => tu.role === TenantRole.ADMIN)) {
      tenantRole = TenantRole.ADMIN
    } else if (user.role === UserRole.TENANT_MANAGER || userWithTenants.tenantUsers?.some((tu: any) => tu.role === TenantRole.MANAGER)) {
      tenantRole = TenantRole.MANAGER
    }

    // Create AuthUser object for token generation
    const authUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRoleType,
      tenantUsers: userWithTenants.tenantUsers?.map((tu: any) => ({
        tenantId: tu.tenantId,
        role: tu.role
      })) || []
    }

    // Generate JWT tokens with tenant ID
    const { accessToken } = await generateTokens(authUser, tenant.id)

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lastLogin: new Date()
      }
    })

    // Log the login event
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id,
        userId: user.id,
        tenantId: tenant.id,
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'POST',
        requestUrl: '/api/v1/tenant/auth/login',
        newValues: objectToJson({
          loginTime: new Date().toISOString(),
          tenantSlug: tenant.slug
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantRole: tenantRole,
          mustChangePassword: user.mustChangePassword
        },
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          businessName: tenant.businessName,
          businessNameAr: tenant.businessNameAr,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          accentColor: tenant.accentColor,
          logoUrl: tenant.logoUrl
        }
      }
    })

  } catch (error) {
    console.error('Tenant login error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
