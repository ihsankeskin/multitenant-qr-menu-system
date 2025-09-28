import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface JwtPayload {
  userId: string
  role: string
  iat?: number
  exp?: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify token
    let payload: JwtPayload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get payment record details
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: {
        id: params.id
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            ownerName: true,
            email: true,
            phone: true,
            address: true,
            subscriptionPlan: true,
            subscriptionStatus: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!paymentRecord) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: paymentRecord
    })

  } catch (error) {
    console.error('Payment record detail API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify token
    let payload: JwtPayload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if payment record exists
    const existingRecord = await prisma.paymentRecord.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Get request body
    const body = await request.json()
    const { 
      amount,
      method,
      status,
      description,
      dueDate,
      paidAt,
      notes
    } = body

    // Prepare update data
    const updateData: any = {}
    
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (method !== undefined) updateData.method = method
    if (status !== undefined) {
      updateData.status = status
      // If marking as paid and no paidAt provided, set current date
      if (status === 'PAID' && !paidAt && !existingRecord.paidAt) {
        updateData.paidAt = new Date()
      }
    }
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null
    if (notes !== undefined) updateData.notes = notes

    // Update payment record
    const updatedRecord = await prisma.paymentRecord.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            ownerName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRecord
    })

  } catch (error) {
    console.error('Update payment record API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify token
    let payload: JwtPayload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'super-admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if payment record exists
    const existingRecord = await prisma.paymentRecord.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion of paid records (business rule)
    if (existingRecord.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete paid payment records' },
        { status: 400 }
      )
    }

    // Delete payment record
    await prisma.paymentRecord.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment record deleted successfully'
    })

  } catch (error) {
    console.error('Delete payment record API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}