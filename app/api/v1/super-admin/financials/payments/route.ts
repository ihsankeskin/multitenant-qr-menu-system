import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

interface JwtPayload {
  userId: string
  role: string
  iat?: number
  exp?: number
}

export async function GET(request: NextRequest) {
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

    // Check if user is super admin or admin
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'super-admin' && payload.role !== 'ADMIN' && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const tenantId = searchParams.get('tenantId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (method && method !== 'all') {
      where.method = method
    }
    
    if (tenantId) {
      where.tenantId = tenantId
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Get payment records with pagination
    const [payments, totalCount] = await Promise.all([
      prisma.paymentRecord.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      
      prisma.paymentRecord.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Financial payments API error:', error)
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

export async function POST(request: NextRequest) {
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

    // Check if user is super admin or admin
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'super-admin' && payload.role !== 'ADMIN' && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { 
      tenantId, 
      amount, 
      method, 
      description, 
      dueDate,
      invoiceNumber
    } = body

    // Validate required fields
    if (!tenantId || !amount || !method || !dueDate || !invoiceNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if invoice number already exists
    const existingPayment = await prisma.paymentRecord.findUnique({
      where: { invoiceNumber }
    })

    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Invoice number already exists' },
        { status: 400 }
      )
    }

    // Create payment record
    const paymentRecord = await prisma.paymentRecord.create({
      data: {
        tenantId,
        amount: parseFloat(amount),
        method,
        status: 'PENDING',
        description: description || '',
        dueDate: new Date(dueDate),
        invoiceNumber,
        createdById: payload.userId
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
      data: paymentRecord
    })

  } catch (error) {
    console.error('Create payment record API error:', error)
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