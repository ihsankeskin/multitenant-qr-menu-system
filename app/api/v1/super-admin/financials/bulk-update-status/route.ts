import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and super admin role
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decodedToken = await verifyToken(token)
    
    if (!decodedToken || decodedToken.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Super admin role required', error: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { paymentIds, status } = body

    // Validation
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Payment IDs are required', error: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required', error: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const validStatuses = ['PAID', 'PENDING', 'OVERDUE', 'CANCELLED', 'REFUNDED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status', error: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Update payment statuses
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    // If status is PAID, set paidAt timestamp
    if (status === 'PAID') {
      updateData.paidAt = new Date()
    }

    const result = await prisma.paymentRecord.updateMany({
      where: {
        id: {
          in: paymentIds
        }
      },
      data: updateData
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decodedToken.id as string,
        action: 'PAYMENT_UPDATE',
        resource: 'PaymentRecord',
        resourceId: paymentIds.join(','),
        newValues: JSON.stringify({ status, count: result.count }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestMethod: 'POST',
        requestUrl: '/api/v1/super-admin/financials/bulk-update-status'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.count} payment(s)`,
      data: {
        updatedCount: result.count
      }
    })

  } catch (error: any) {
    console.error('====== BULK UPDATE STATUS ERROR ======')
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('======================================')
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update payment statuses',
        error: 'INTERNAL_ERROR',
        debug: {
          message: error?.message
        }
      },
      { status: 500 }
    )
  }
}
