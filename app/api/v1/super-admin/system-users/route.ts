import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

interface JWTPayload {
  userId?: string
  sub?: string
  id?: string
  role: string
  email: string
}

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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

    // Verify super admin or admin role (handle both 'SUPER_ADMIN' and 'super-admin' formats)
    const normalizedRole = decoded.role?.toUpperCase().replace(/-/g, '_') || ''
    if (normalizedRole !== 'SUPER_ADMIN' && normalizedRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin or admin only.' },
        { status: 403 }
      )
    }

    // Get system users (super-admins and other system-level users)
    const systemUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'ADMIN'] // Only system-level users (database format)
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

    // Verify super admin or admin role (handle both 'SUPER_ADMIN' and 'super-admin' formats)
    const normalizedRole = decoded.role?.toUpperCase().replace(/-/g, '_') || ''
    if (normalizedRole !== 'SUPER_ADMIN' && normalizedRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin or admin only.' },
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

    if (!['super-admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role. Must be super-admin or admin' },
        { status: 400 }
      )
    }

    // Normalize role to database format (SUPER_ADMIN, ADMIN)
    const dbRole = role === 'super-admin' || role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN'

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
        role: dbRole,
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

export async function PUT(request: NextRequest) {
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

    // Verify super admin or admin role (handle both 'SUPER_ADMIN' and 'super-admin' formats)
    const normalizedRole = decoded.role?.toUpperCase().replace(/-/g, '_') || ''
    if (normalizedRole !== 'SUPER_ADMIN' && normalizedRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin or admin only.' },
        { status: 403 }
      )
    }

    const { id, email, firstName, lastName, role, isActive } = await request.json()

    // Validation
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (email !== undefined && email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        )
      }
      
      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: email.toLowerCase().trim(),
          id: { not: id }
        }
      })
      
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Email already taken by another user' },
          { status: 409 }
        )
      }
      
      updateData.email = email.toLowerCase().trim()
    }

    if (firstName !== undefined && firstName.trim()) {
      updateData.firstName = firstName.trim()
    }

    if (lastName !== undefined && lastName.trim()) {
      updateData.lastName = lastName.trim()
    }

    if (role !== undefined) {
      if (!['super-admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(role)) {
        return NextResponse.json(
          { success: false, message: 'Invalid role. Must be super-admin or admin' },
          { status: 400 }
        )
      }
      // Normalize role to database format (SUPER_ADMIN, ADMIN)
      updateData.role = role === 'super-admin' || role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN'
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        createdAt: updatedUser.createdAt.toISOString(),
        lastLoginAt: updatedUser.lastLogin?.toISOString()
      },
      message: 'System user updated successfully'
    })

  } catch (error) {
    console.error('Update system user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update system user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Verify super admin or admin role (handle both 'SUPER_ADMIN' and 'super-admin' formats)
    const normalizedRole = decoded.role?.toUpperCase().replace(/-/g, '_') || ''
    if (normalizedRole !== 'SUPER_ADMIN' && normalizedRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin or admin only.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting yourself
    const currentUserId = decoded.userId || decoded.sub
    if (currentUserId === id) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'System user deleted successfully'
    })

  } catch (error) {
    console.error('Delete system user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete system user' },
      { status: 500 }
    )
  }
}
