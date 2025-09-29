import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/v1/super-admin/tenants/[id]/users - Get tenant users
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || (payload.role !== 'super-admin' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const tenantId = params.id

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get tenant users through TenantUser relationship
    const tenantUsers = await prisma.tenantUser.findMany({
      where: { tenantId: tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLogin: true
          }
        }
      }
    })

    const users = tenantUsers.map(tu => ({
      id: tu.user.id,
      email: tu.user.email,
      firstName: tu.user.firstName,
      lastName: tu.user.lastName,
      role: tu.role, // Tenant role
      isActive: tu.isActive && tu.user.isActive,
      createdAt: tu.user.createdAt.toISOString(),
      lastLoginAt: tu.user.lastLogin?.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: users,
      message: 'Tenant users retrieved successfully'
    })

  } catch (error) {
    console.error('Get tenant users error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve tenant users' },
      { status: 500 }
    )
  }
}

// POST /api/v1/super-admin/tenants/[id]/users - Create tenant user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || (payload.role !== 'super-admin' && payload.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    const tenantId = params.id
    const body = await request.json()

    const { firstName, lastName, email, password, role = 'admin' } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, email, and password are required' },
        { status: 400 }
      )
    }

    // Map role to uppercase format expected by database
    const roleMapping: { [key: string]: string } = {
      'admin': 'ADMIN',
      'manager': 'MANAGER', 
      'staff': 'STAFF'
    }
    
    const tenantRole = roleMapping[role.toLowerCase()] || 'STAFF'

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and tenant user relationship in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'user', // Base role is user
          isActive: true
        }
      })

      // Create tenant user relationship
      const tenantUser = await tx.tenantUser.create({
        data: {
          userId: newUser.id,
          tenantId: tenantId,
          role: tenantRole, // Use mapped role (ADMIN, MANAGER, STAFF)
          isActive: true,
          createdById: (payload.sub as string) || newUser.id // Use the super admin user ID or the new user ID as fallback
        }
      })

      return {
        user: newUser,
        tenantUser
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        role: result.tenantUser.role,
        isActive: result.tenantUser.isActive,
        createdAt: result.user.createdAt.toISOString()
      },
      message: 'Tenant user created successfully'
    })

  } catch (error) {
    console.error('Create tenant user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create tenant user' },
      { status: 500 }
    )
  }
}