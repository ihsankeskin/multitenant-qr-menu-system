import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

interface JWTPayload {
  userId: string
  role: string
  email: string
}

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined')
    }

    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify super admin role
    if (decoded.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin only.' },
        { status: 403 }
      )
    }

    // Get system users (super-admins and other system-level users)
    const systemUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['super-admin', 'admin'] // Only system-level users
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedUsers = systemUsers.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLogin?.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      message: 'System users retrieved successfully'
    })

  } catch (error) {
    console.error('Get system users error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve system users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined')
    }

    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify super admin role
    if (decoded.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin only.' },
        { status: 403 }
      )
    }

    const { email, firstName, lastName, role, isActive = true } = await request.json()

    // Validation
    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    if (!firstName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'First name is required' },
        { status: 400 }
      )
    }

    if (!lastName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Last name is required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!['super-admin', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role. Must be super-admin or admin' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate temporary password (user should change on first login)
    const tempPassword = Math.random().toString(36).slice(-12)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create new system user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: hashedPassword,
        role,
        isActive,
        emailVerified: false // They should verify their email
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    })

    // In a real implementation, you would send an email with login credentials
    console.log(`New system user created: ${email} with temporary password: ${tempPassword}`)

    return NextResponse.json({
      success: true,
      data: {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
        lastLoginAt: newUser.lastLogin?.toISOString(),
        tempPassword // Remove this in production - send via email instead
      },
      message: 'System user created successfully'
    })

  } catch (error) {
    console.error('Create system user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create system user' },
      { status: 500 }
    )
  }
}